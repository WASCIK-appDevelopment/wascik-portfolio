import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const CURRENT_ID = "current";
const BUCKET = "owner-ad-work-progress";
const PATH = "current/latest-preview.png";
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function signedUrl(base: string, key: string) {
  const encoded = PATH.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${base}/storage/v1/object/sign/${BUCKET}/${encoded}`, {
    method: "POST",
    headers: headers(key),
    body: JSON.stringify({ expiresIn: 60 * 60 }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  const signed = typeof data.signedURL === "string" ? data.signedURL : typeof data.signedUrl === "string" ? data.signedUrl : "";
  return signed.startsWith("http") ? signed : signed ? `${base}/storage/v1${signed.startsWith("/") ? "" : "/"}${signed}` : "";
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad workspace storage is not configured." }, { status: 503 });
  const form = await request.formData();
  const value = form.get("file");
  if (!(value instanceof File)) return NextResponse.json({ error: "Preview image is required." }, { status: 400 });
  if (value.size <= 0 || value.size > MAX_FILE_SIZE || !value.type.startsWith("image/")) return NextResponse.json({ error: "Preview must be an image under 15 MB." }, { status: 400 });

  const encoded = PATH.split("/").map(encodeURIComponent).join("/");
  const upload = await fetch(`${config.supabaseUrl}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: "POST",
    headers: {
      apikey: config.supabaseServerKey,
      Authorization: `Bearer ${config.supabaseServerKey}`,
      "Content-Type": "image/png",
      "Cache-Control": "3600",
      "x-upsert": "true",
    },
    body: Buffer.from(await value.arrayBuffer()),
  });
  if (!upload.ok) return NextResponse.json({ error: "Could not save the current ad preview." }, { status: 502 });

  await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_work_progress?id=eq.${CURRENT_ID}`, {
    method: "PATCH",
    headers: headers(config.supabaseServerKey),
    body: JSON.stringify({ preview_storage_path: PATH, preview_mime_type: "image/png", updated_at: new Date().toISOString() }),
  });

  return NextResponse.json({ saved: true, previewUrl: await signedUrl(config.supabaseUrl, config.supabaseServerKey) });
}
