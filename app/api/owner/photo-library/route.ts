import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const BUCKET = "owner-photo-library";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function safeLabel(value: FormDataEntryValue | null, fallback: string) {
  const text = typeof value === "string" ? value.trim().slice(0, 80) : "";
  return text || fallback.slice(0, 80) || "My Photo";
}

function safeCategory(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim().slice(0, 50) : "";
  return text || "General";
}

function extensionFor(file: File) {
  const fromName = file.name.toLowerCase().match(/\.(jpe?g|png|webp|heic|heif)$/)?.[1];
  if (fromName) return fromName === "jpeg" ? "jpg" : fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  if (file.type === "image/heif") return "heif";
  return "jpg";
}

async function removeStorageObject(supabaseUrl: string, key: string, path: string) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: headers(key),
    body: JSON.stringify({ prefixes: [path] }),
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function signedUrl(supabaseUrl: string, key: string, path: string) {
  const response = await fetch(`${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ expiresIn: 60 * 60 }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return "";
  const signed = typeof data.signedURL === "string" ? data.signedURL : typeof data.signedUrl === "string" ? data.signedUrl : "";
  if (!signed) return "";
  return signed.startsWith("http") ? signed : `${supabaseUrl}/storage/v1${signed.startsWith("/") ? "" : "/"}${signed}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Photo storage is not configured." }, { status: 503 });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/owner_photo_library?select=id,label,category,storage_path,mime_type,original_name,file_size_bytes,created_at&order=created_at.desc`, {
    headers: headers(config.supabaseServerKey),
    cache: "no-store",
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(rows)) return NextResponse.json({ error: "Could not load My Photos." }, { status: 502 });

  const photos = await Promise.all(rows.map(async (row) => ({
    id: String(row.id || ""),
    label: String(row.label || "My Photo"),
    category: String(row.category || "General"),
    originalName: String(row.original_name || ""),
    mimeType: String(row.mime_type || ""),
    fileSizeBytes: Number(row.file_size_bytes || 0),
    createdAt: String(row.created_at || ""),
    url: await signedUrl(config.supabaseUrl, config.supabaseServerKey!, String(row.storage_path || "")),
  })));

  return NextResponse.json({ photos: photos.filter((photo) => photo.id && photo.url) });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Photo storage is not configured." }, { status: 503 });

  const form = await request.formData();
  const value = form.get("file");
  if (!(value instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  if (!ALLOWED_TYPES.has(value.type)) return NextResponse.json({ error: "Use JPG, PNG, WEBP, HEIC, or HEIF." }, { status: 400 });
  if (value.size <= 0 || value.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Each photo must be 10 MB or smaller." }, { status: 400 });

  const id = randomUUID();
  const path = `${new Date().toISOString().slice(0, 10)}/${id}.${extensionFor(value)}`;
  const uploadResponse = await fetch(`${config.supabaseUrl}/storage/v1/object/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: {
      apikey: config.supabaseServerKey,
      Authorization: `Bearer ${config.supabaseServerKey}`,
      "Content-Type": value.type,
      "Cache-Control": "3600",
      "x-upsert": "false",
    },
    body: Buffer.from(await value.arrayBuffer()),
  });
  const uploadBody = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) {
    console.error("Owner photo upload failed", uploadResponse.status, uploadBody);
    return NextResponse.json({ error: "The photo could not be stored." }, { status: 502 });
  }

  const label = safeLabel(form.get("label"), value.name.replace(/\.[^.]+$/, ""));
  const category = safeCategory(form.get("category"));
  const insertResponse = await fetch(`${config.supabaseUrl}/rest/v1/owner_photo_library`, {
    method: "POST",
    headers: { ...headers(config.supabaseServerKey), Prefer: "return=representation" },
    body: JSON.stringify({ id, label, category, storage_path: path, mime_type: value.type, original_name: value.name.slice(0, 255), file_size_bytes: value.size }),
  });
  const inserted = await insertResponse.json().catch(() => []);
  if (!insertResponse.ok) {
    await removeStorageObject(config.supabaseUrl, config.supabaseServerKey, path).catch(() => null);
    return NextResponse.json({ error: "The photo uploaded but could not be added to My Photos." }, { status: 502 });
  }

  const url = await signedUrl(config.supabaseUrl, config.supabaseServerKey, path);
  return NextResponse.json({ photo: { ...(Array.isArray(inserted) ? inserted[0] : inserted), url } });
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Photo storage is not configured." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Photo id is required." }, { status: 400 });

  const lookup = await fetch(`${config.supabaseUrl}/rest/v1/owner_photo_library?id=eq.${encodeURIComponent(id)}&select=storage_path`, { headers: headers(config.supabaseServerKey), cache: "no-store" });
  const rows = await lookup.json().catch(() => []);
  const path = Array.isArray(rows) ? String(rows[0]?.storage_path || "") : "";
  if (!lookup.ok || !path) return NextResponse.json({ error: "Photo not found." }, { status: 404 });

  const unlink = await fetch(`${config.supabaseUrl}/rest/v1/wascik_service_approved_media?photo_id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: headers(config.supabaseServerKey),
  });
  if (!unlink.ok) return NextResponse.json({ error: "The photo is assigned to a WASCIK service and could not be unlinked." }, { status: 502 });

  const { response: deleteObject, body: deleteObjectBody } = await removeStorageObject(config.supabaseUrl, config.supabaseServerKey, path);
  if (!deleteObject.ok && deleteObject.status !== 404) {
    console.error("Owner photo storage delete failed", deleteObject.status, deleteObjectBody);
    return NextResponse.json({ error: "The stored photo could not be removed." }, { status: 502 });
  }

  const deleteRow = await fetch(`${config.supabaseUrl}/rest/v1/owner_photo_library?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: headers(config.supabaseServerKey) });
  if (!deleteRow.ok) return NextResponse.json({ error: "The photo record could not be removed." }, { status: 502 });
  return NextResponse.json({ removed: true, id });
}
