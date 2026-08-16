import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { unifiedAffiliateCatalog } from "../../../../../lib/ai/unifiedAffiliateCatalog";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
type ScanItem = { id: string; merchant: string; title: string; description: string; affiliateUrl: string; pagePath: string | null; removable: boolean; source: "builtin" | "uploaded" };
const TOKEN_TTL_MS = 5 * 60 * 1000;

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function serverHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = { apikey: key };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

function removalPayload(ids: string[], expiresAt: number) { return JSON.stringify({ ids, expiresAt }); }
function createRemovalToken(ids: string[]) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim(); if (!secret) return "";
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  return `${expiresAt}.${createHmac("sha256", secret).update(removalPayload(ids, expiresAt)).digest("base64url")}`;
}
function removalAuthorized(ids: string[], token: unknown) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim(); const value = typeof token === "string" ? token : ""; const dot = value.indexOf(".");
  if (!secret || dot < 1) return false; const expiresAt = Number(value.slice(0, dot)); if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const a = Buffer.from(value.slice(dot + 1)); const b = Buffer.from(createHmac("sha256", secret).update(removalPayload(ids, expiresAt)).digest("base64url"));
  return a.length === b.length && timingSafeEqual(a, b);
}

function expiredDate(description: string) {
  const match = description.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/i);
  if (!match) return null;
  const date = new Date(`${match[1]} ${match[2]}, ${match[3]} 23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date.getTime() < Date.now() ? date : null;
}

const UNAVAILABLE_MARKERS = [
  "product not found", "item not found", "page not found", "this product is no longer available",
  "no longer available", "product has been discontinued", "this item has been discontinued",
  "currently unavailable", "item unavailable", "out of stock", "sold out",
];

function visiblePageText(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").toLowerCase();
}

async function checkMerchantListing(url: string) {
  try {
    const response = await fetch(url, { method: "GET", redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(9000), headers: { "User-Agent": "Mozilla/5.0 (compatible; WASCIK-Product-Monitor/2.0)", Accept: "text/html,application/xhtml+xml" } });
    const broken = response.status === 404 || response.status === 410;
    const contentType = response.headers.get("content-type") || "";
    const text = response.ok && contentType.includes("text/html") ? visiblePageText((await response.text()).slice(0, 1_500_000)) : "";
    const marker = UNAVAILABLE_MARKERS.find((value) => text.includes(value));
    return { status: response.status, broken, unavailable: Boolean(marker), marker: marker || "", finalUrl: response.url || url };
  } catch { return { status: 0, broken: false, unavailable: false, marker: "", finalUrl: url }; }
}

function normalizedMerchant(value: string) {
  const compact = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (["focuscamera", "focusbylifestyle", "lifestylebyfocus"].includes(compact)) return "focuscamera";
  return compact;
}

function normalizedTitle(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/\b(the|new)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const builtIn: ScanItem[] = unifiedAffiliateCatalog.map((item) => ({ id: item.id, merchant: item.merchant, title: item.title, description: item.description, affiliateUrl: item.affiliateUrl, pagePath: item.pagePath || "/affiliate-services", removable: true, source: "builtin" }));
  const config = getStage6Config();
  let uploaded: ScanItem[] = [];
  if (config.databaseConfigured && config.supabaseServerKey) {
    const query = new URLSearchParams({ select: "id,merchant,title,description,affiliate_url,page_path", approval_status: "eq.approved", published_at: "not.is.null", limit: "500" });
    const response = await fetch(`${config.supabaseUrl}/rest/v1/approved_affiliate_products?${query.toString()}`, { headers: serverHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" });
    const rows = await response.json().catch(() => []);
    if (response.ok && Array.isArray(rows)) uploaded = rows.map((row) => ({ id: String(row.id || ""), merchant: String(row.merchant || "Unknown"), title: String(row.title || "Untitled"), description: String(row.description || ""), affiliateUrl: String(row.affiliate_url || ""), pagePath: row.page_path ? String(row.page_path) : null, removable: true, source: "uploaded" as const })).filter((item) => item.id && item.affiliateUrl);
  }
  const suppressionResponse = config.databaseConfigured && config.supabaseServerKey ? await fetch(`${config.supabaseUrl}/rest/v1/affiliate_catalog_suppressions?select=product_id`, { headers: serverHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" }) : null;
  const suppressionRows = suppressionResponse?.ok ? await suppressionResponse.json().catch(() => []) : [];
  const suppressed = new Set(Array.isArray(suppressionRows) ? suppressionRows.map((row) => String(row.product_id || "")) : []);
  const items = [...builtIn.filter((item) => !suppressed.has(item.id)), ...uploaded];
  const uniqueUrls = Array.from(new Set(items.map((item) => item.affiliateUrl).filter(Boolean)));
  const linkResults = new Map<string, Awaited<ReturnType<typeof checkMerchantListing>>>();
  for (let index = 0; index < uniqueUrls.length; index += 8) {
    const group = uniqueUrls.slice(index, index + 8);
    const results = await Promise.all(group.map((url) => checkMerchantListing(url)));
    group.forEach((url, resultIndex) => linkResults.set(url, results[resultIndex]));
  }
  const candidates = new Map<string, ScanItem & { reason: string; kind: string; finalUrl?: string }>();
  items.forEach((item) => {
    const expired = expiredDate(item.description);
    const link = linkResults.get(item.affiliateUrl);
    if (!expired && !link?.broken && !link?.unavailable) return;
    const reason = expired ? `Event date passed: ${expired.toLocaleDateString("en-US")}` : link?.broken ? `Merchant product page returned ${link.status}` : `Merchant product page says “${link?.marker}.”`;
    candidates.set(`${item.source}:${item.id}`, { ...item, affiliateUrl: link?.finalUrl || item.affiliateUrl, reason, kind: expired ? "expired_event" : "missing_listing", finalUrl: link?.finalUrl });
  });
  const duplicateGroups = new Map<string, ScanItem[]>();
  items.forEach((item) => {
    const key = `${normalizedMerchant(item.merchant)}|${normalizedTitle(item.title)}`;
    if (!normalizedTitle(item.title)) return;
    duplicateGroups.set(key, [...(duplicateGroups.get(key) || []), item]);
  });
  duplicateGroups.forEach((group) => {
    if (group.length < 2) return;
    const keeper = group[0];
    group.slice(1).forEach((item) => {
      const id = `${item.source}:${item.id}`;
      const duplicateReason = `Possible duplicate of “${keeper.title}” from ${keeper.merchant}.`;
      const existing = candidates.get(id);
      candidates.set(id, { ...item, reason: existing ? `${existing.reason} Also: ${duplicateReason}` : duplicateReason, kind: existing ? `${existing.kind},duplicate_listing` : "duplicate_listing", finalUrl: existing?.finalUrl });
    });
  });
  const candidateList = Array.from(candidates.values());
  return NextResponse.json({ checkedAt: new Date().toISOString(), checkedCount: items.length, brandCount: new Set(items.map((item) => item.merchant)).size, candidates: candidateList, message: candidateList.length ? `${candidateList.length} item${candidateList.length === 1 ? "" : "s"} need your review.` : "No definitely expired, unavailable, missing, or duplicate items were found." });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { action?: string; items?: unknown; confirmationToken?: unknown };
  const raw = Array.isArray(body.items) ? body.items : [];
  const items = raw.slice(0, 100).flatMap((value) => { if (!value || typeof value !== "object") return []; const item = value as Record<string, unknown>; const id = typeof item.id === "string" ? item.id.slice(0, 240) : ""; return id ? [{ id, merchant: String(item.merchant || "Unknown").slice(0, 200), title: String(item.title || "Untitled").slice(0, 500), reason: String(item.reason || "Owner-confirmed removal").slice(0, 1000), source: item.source === "uploaded" ? "uploaded" : "builtin" }] : []; });
  const ids = Array.from(new Set(items.map((item) => `${item.source}:${item.id}`))).sort();
  if (!ids.length) return NextResponse.json({ error: "Select at least one product." }, { status: 400 });
  if (body.action === "propose_remove") return NextResponse.json({ confirmationToken: createRemovalToken(ids), summary: `Remove ${ids.length} flagged product${ids.length === 1 ? "" : "s"} from publication?` });
  if (body.action !== "confirm_remove" || !removalAuthorized(ids, body.confirmationToken)) return NextResponse.json({ error: "Unauthorized or unconfirmed removal." }, { status: 401 });
  const config = getStage6Config(); if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const headers = { ...serverHeaders(config.supabaseServerKey, config.supabaseKeyKind), "Content-Type": "application/json", Prefer: "return=representation" };
  for (const item of items) {
    const url = item.source === "uploaded" ? `${config.supabaseUrl}/rest/v1/approved_affiliate_products?id=eq.${encodeURIComponent(item.id)}` : `${config.supabaseUrl}/rest/v1/affiliate_catalog_suppressions?on_conflict=product_id`;
    const response = await fetch(url, { method: item.source === "uploaded" ? "DELETE" : "POST", headers, ...(item.source === "builtin" ? { body: JSON.stringify({ product_id: item.id, merchant: item.merchant, title: item.title, reason: item.reason }) } : {}) });
    if (!response.ok) return NextResponse.json({ error: "Could not remove one or more products." }, { status: 502 });
  }
  return NextResponse.json({ success: true, message: "Selected products removed from publication." });
}
