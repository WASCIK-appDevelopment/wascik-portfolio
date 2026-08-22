import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const BUCKET = "owner-ad-library";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function safeText(value: FormDataEntryValue | null, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeJsonArray(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").map((item) => item.slice(0, 120)).slice(0, 30) : [];
  } catch {
    return [];
  }
}

function extensionFor(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/webp") return "webp";
  return "png";
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
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad library storage is not configured." }, { status: 503 });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_library?select=id,title,brand,product_or_service,platform,storage_path,headline,primary_copy,cta,sales_line,hashtags,metadata,created_at&order=created_at.desc&limit=200`, {
    headers: headers(config.supabaseServerKey),
    cache: "no-store",
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(rows)) return NextResponse.json({ error: "Could not load My Ad Library." }, { status: 502 });

  const ads = await Promise.all(rows.map(async (row) => ({
    id: String(row.id || ""),
    title: String(row.title || "Saved Ad"),
    brand: String(row.brand || ""),
    productOrService: String(row.product_or_service || ""),
    platform: String(row.platform || ""),
    headline: String(row.headline || ""),
    primaryCopy: String(row.primary_copy || ""),
    cta: String(row.cta || ""),
    salesLine: String(row.sales_line || ""),
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    createdAt: String(row.created_at || ""),
    imageUrl: await signedUrl(config.supabaseUrl, config.supabaseServerKey!, String(row.storage_path || "")),
  })));

  return NextResponse.json({ ads: ads.filter((ad) => ad.id && ad.imageUrl) });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad library storage is not configured." }, { status: 503 });

  const form = await request.formData();
  const value = form.get("file");
  if (!(value instanceof File)) return NextResponse.json({ error: "A finished ad image is required." }, { status: 400 });
  if (!ALLOWED_TYPES.has(value.type)) return NextResponse.json({ error: "Saved ads must be PNG, JPG, or WEBP images." }, { status: 400 });
  if (value.size <= 0 || value.size > MAX_FILE_SIZE) return NextResponse.json({ error: "The finished ad must be 15 MB or smaller." }, { status: 400 });

  const brand = safeText(form.get("brand"), 160) || "WASCIK";
  const productOrService = safeText(form.get("productOrService"), 260) || "Ad";
  const platform = safeText(form.get("platform"), 80) || "General";
  const headline = safeText(form.get("headline"), 500);
  const primaryCopy = safeText(form.get("primaryCopy"), 6000);
  const cta = safeText(form.get("cta"), 1000);
  const salesLine = safeText(form.get("salesLine"), 2000);
  const hashtags = safeJsonArray(form.get("hashtags"));
  const title = safeText(form.get("title"), 240) || `${brand} — ${productOrService}`;

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
    console.error("Owner ad upload failed", uploadResponse.status, uploadBody);
    return NextResponse.json({ error: "The finished ad could not be stored." }, { status: 502 });
  }

  const insertResponse = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_library`, {
    method: "POST",
    headers: { ...headers(config.supabaseServerKey), Prefer: "return=representation" },
    body: JSON.stringify({
      id,
      title,
      brand,
      product_or_service: productOrService,
      platform,
      storage_path: path,
      headline,
      primary_copy: primaryCopy,
      cta,
      sales_line: salesLine,
      hashtags,
      metadata: { source: "social-ads-photo-composer" },
    }),
  });
  const inserted = await insertResponse.json().catch(() => []);
  if (!insertResponse.ok) {
    await fetch(`${config.supabaseUrl}/storage/v1/object/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, { method: "DELETE", headers: headers(config.supabaseServerKey) }).catch(() => null);
    return NextResponse.json({ error: "The ad image uploaded but could not be added to My Ad Library." }, { status: 502 });
  }

  const imageUrl = await signedUrl(config.supabaseUrl, config.supabaseServerKey, path);
  return NextResponse.json({ ad: { ...(Array.isArray(inserted) ? inserted[0] : inserted), imageUrl } });
}

export async function DELETE(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad library storage is not configured." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Ad id is required." }, { status: 400 });

  const lookup = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_library?id=eq.${encodeURIComponent(id)}&select=storage_path`, { headers: headers(config.supabaseServerKey), cache: "no-store" });
  const rows = await lookup.json().catch(() => []);
  const path = Array.isArray(rows) ? String(rows[0]?.storage_path || "") : "";
  if (!lookup.ok || !path) return NextResponse.json({ error: "Saved ad not found." }, { status: 404 });

  const deleteObject = await fetch(`${config.supabaseUrl}/storage/v1/object/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, { method: "DELETE", headers: headers(config.supabaseServerKey) });
  if (!deleteObject.ok && deleteObject.status !== 404) return NextResponse.json({ error: "The saved ad image could not be removed." }, { status: 502 });

  const deleteRow = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_library?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: headers(config.supabaseServerKey) });
  if (!deleteRow.ok) return NextResponse.json({ error: "The saved ad record could not be removed." }, { status: 502 });
  return NextResponse.json({ removed: true, id });
}
