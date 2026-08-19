import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const CURRENT_ID = "current";
const BUCKET = "owner-ad-work-progress";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function clean(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringArray(value: unknown, maxItems = 30) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim().slice(0, 500)).filter(Boolean).slice(0, maxItems) : [];
}

async function signedUrl(base: string, key: string, path: string) {
  if (!path) return "";
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${base}/storage/v1/object/sign/${BUCKET}/${encoded}`, {
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
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad workspace storage is not configured." }, { status: 503 });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_work_progress?id=eq.${CURRENT_ID}&select=*`, {
    headers: headers(config.supabaseServerKey), cache: "no-store",
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not load Ad Work in Progress." }, { status: 502 });
  const draft = Array.isArray(rows) ? rows[0] : null;
  if (!draft) return NextResponse.json({ draft: null });
  const previewUrl = await signedUrl(config.supabaseUrl, config.supabaseServerKey, String(draft.preview_storage_path || ""));
  return NextResponse.json({ draft: { ...draft, preview_url: previewUrl } });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad workspace storage is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const product = body.product && typeof body.product === "object" ? body.product as Record<string, unknown> : {};
  const productId = clean(product.id, 240);
  const merchant = clean(product.merchant, 200);
  const title = clean(product.title, 500);
  if (!productId || !merchant || !title) return NextResponse.json({ error: "A product or service is required." }, { status: 400 });

  const now = new Date().toISOString();
  const row = {
    id: CURRENT_ID,
    product_id: productId,
    merchant,
    title,
    category: clean(product.category, 250) || null,
    description: clean(product.description, 5000) || null,
    features: stringArray(product.features),
    destination_url: clean(product.affiliate_url, 3000) || null,
    image_url: clean(product.image_url, 3000) || null,
    price: clean(product.price, 100) || null,
    page_path: clean(product.page_path, 1000) || null,
    source: clean(product.source, 250) || null,
    platform: null,
    objective: merchant === "WASCIK App Development" ? "Drive qualified interest in this WASCIK service" : "Drive product interest and affiliate clicks",
    creative_notes: null,
    subscription_url: null,
    result: null,
    preview_storage_path: null,
    preview_mime_type: null,
    status: "in_progress",
    updated_at: now,
  };

  const response = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_work_progress?on_conflict=id`, {
    method: "POST",
    headers: { ...headers(config.supabaseServerKey), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not start the ad workspace." }, { status: 502 });
  return NextResponse.json({ draft: Array.isArray(data) ? data[0] : data });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad workspace storage is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("platform" in body) patch.platform = clean(body.platform, 80) || null;
  if ("objective" in body) patch.objective = clean(body.objective, 500) || null;
  if ("creativeNotes" in body) patch.creative_notes = clean(body.creativeNotes, 4000) || null;
  if ("subscriptionUrl" in body) patch.subscription_url = clean(body.subscriptionUrl, 3000) || null;
  if ("result" in body) patch.result = body.result && typeof body.result === "object" ? body.result : null;
  if ("status" in body) patch.status = clean(body.status, 40) || "in_progress";

  const response = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_work_progress?id=eq.${CURRENT_ID}`, {
    method: "PATCH",
    headers: { ...headers(config.supabaseServerKey), Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not save Ad Work in Progress." }, { status: 502 });
  return NextResponse.json({ draft: Array.isArray(data) ? data[0] : data });
}
