import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const PHOTO_BUCKET = "owner-photo-library";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function signedPhotoUrl(base: string, key: string, path: string) {
  if (!path) return "";
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${base}/storage/v1/object/sign/${PHOTO_BUCKET}/${encoded}`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ expiresIn: 60 * 60 }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return "";
  const signed = typeof data.signedURL === "string" ? data.signedURL : typeof data.signedUrl === "string" ? data.signedUrl : "";
  if (!signed) return "";
  return signed.startsWith("http") ? signed : `${base}/storage/v1${signed.startsWith("/") ? "" : "/"}${signed}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Service media storage is not configured." }, { status: 503 });

  const mapResponse = await fetch(`${config.supabaseUrl}/rest/v1/wascik_service_approved_media?select=service_id,photo_id,updated_at`, { headers: headers(config.supabaseServerKey), cache: "no-store" });
  const mappings = await mapResponse.json().catch(() => []);
  if (!mapResponse.ok || !Array.isArray(mappings)) return NextResponse.json({ error: "Could not load approved service media." }, { status: 502 });

  const photoIds = mappings.map((row) => String(row.photo_id || "")).filter(Boolean);
  if (!photoIds.length) return NextResponse.json({ assignments: [] });
  const inFilter = photoIds.map((id) => `\"${id.replace(/\"/g, "")}\"`).join(",");
  const photoResponse = await fetch(`${config.supabaseUrl}/rest/v1/owner_photo_library?id=in.(${encodeURIComponent(inFilter)})&select=id,label,category,storage_path`, { headers: headers(config.supabaseServerKey), cache: "no-store" });
  const photos = await photoResponse.json().catch(() => []);
  const photoMap = new Map(Array.isArray(photos) ? photos.map((row) => [String(row.id || ""), row]) : []);

  const assignments = await Promise.all(mappings.map(async (row) => {
    const photo = photoMap.get(String(row.photo_id || ""));
    const path = photo ? String(photo.storage_path || "") : "";
    return {
      serviceId: String(row.service_id || ""),
      photoId: String(row.photo_id || ""),
      label: photo ? String(photo.label || "Approved photo") : "Approved photo",
      category: photo ? String(photo.category || "General") : "General",
      url: await signedPhotoUrl(config.supabaseUrl, config.supabaseServerKey!, path),
      updatedAt: String(row.updated_at || ""),
    };
  }));
  return NextResponse.json({ assignments: assignments.filter((item) => item.serviceId && item.photoId && item.url) });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Service media storage is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const serviceId = typeof body.serviceId === "string" ? body.serviceId.trim().slice(0, 240) : "";
  const photoId = typeof body.photoId === "string" ? body.photoId.trim().slice(0, 100) : "";
  if (!serviceId.startsWith("wascik-service-") || !photoId) return NextResponse.json({ error: "Choose a WASCIK service and an approved photo." }, { status: 400 });

  const serviceResponse = await fetch(`${config.supabaseUrl}/rest/v1/approved_affiliate_products?id=eq.${encodeURIComponent(serviceId)}&merchant=eq.${encodeURIComponent("WASCIK App Development")}&select=id`, { headers: headers(config.supabaseServerKey), cache: "no-store" });
  const services = await serviceResponse.json().catch(() => []);
  if (!serviceResponse.ok || !Array.isArray(services) || !services.length) return NextResponse.json({ error: "WASCIK service not found." }, { status: 404 });

  const photoResponse = await fetch(`${config.supabaseUrl}/rest/v1/owner_photo_library?id=eq.${encodeURIComponent(photoId)}&select=id,label,category,storage_path`, { headers: headers(config.supabaseServerKey), cache: "no-store" });
  const photos = await photoResponse.json().catch(() => []);
  if (!photoResponse.ok || !Array.isArray(photos) || !photos.length) return NextResponse.json({ error: "Photo not found in My Photos." }, { status: 404 });

  const saveResponse = await fetch(`${config.supabaseUrl}/rest/v1/wascik_service_approved_media?on_conflict=service_id`, {
    method: "POST",
    headers: { ...headers(config.supabaseServerKey), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ service_id: serviceId, photo_id: photoId, updated_at: new Date().toISOString() }),
  });
  if (!saveResponse.ok) return NextResponse.json({ error: "Could not assign the approved service photo." }, { status: 502 });
  const photo = photos[0];
  return NextResponse.json({ assignment: { serviceId, photoId, label: String(photo.label || "Approved photo"), category: String(photo.category || "General"), url: await signedPhotoUrl(config.supabaseUrl, config.supabaseServerKey, String(photo.storage_path || "")) } });
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Service media storage is not configured." }, { status: 503 });
  const serviceId = new URL(request.url).searchParams.get("serviceId")?.trim() || "";
  if (!serviceId.startsWith("wascik-service-")) return NextResponse.json({ error: "Service id is required." }, { status: 400 });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/wascik_service_approved_media?service_id=eq.${encodeURIComponent(serviceId)}`, { method: "DELETE", headers: headers(config.supabaseServerKey) });
  if (!response.ok) return NextResponse.json({ error: "Could not remove the approved service photo." }, { status: 502 });
  return NextResponse.json({ removed: true, serviceId });
}
