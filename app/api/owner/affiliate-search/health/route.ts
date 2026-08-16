import { NextResponse } from "next/server";
import { unifiedAffiliateCatalog } from "../../../../../lib/ai/unifiedAffiliateCatalog";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
type ScanItem = { id: string; merchant: string; title: string; description: string; affiliateUrl: string; pagePath: string | null; removable: boolean };

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

function expiredDate(description: string) {
  const match = description.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/i);
  if (!match) return null;
  const date = new Date(`${match[1]} ${match[2]}, ${match[3]} 23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date.getTime() < Date.now() ? date : null;
}

async function checkLink(url: string) {
  const run = async (method: "HEAD" | "GET") => fetch(url, { method, redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(7000), headers: { "User-Agent": "WASCIK-Product-Monitor/1.0", ...(method === "GET" ? { Range: "bytes=0-0" } : {}) } });
  try {
    let response = await run("HEAD");
    if ([403, 405].includes(response.status)) response = await run("GET");
    return { status: response.status, broken: response.status === 404 || response.status === 410 };
  } catch { return { status: 0, broken: false }; }
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const builtIn: ScanItem[] = unifiedAffiliateCatalog.map((item) => ({ id: item.id, merchant: item.merchant, title: item.title, description: item.description, affiliateUrl: item.affiliateUrl, pagePath: item.pagePath || "/affiliate-services", removable: false }));
  const config = getStage6Config();
  let uploaded: ScanItem[] = [];
  if (config.databaseConfigured && config.supabaseServerKey) {
    const query = new URLSearchParams({ select: "id,merchant,title,description,affiliate_url,page_path", approval_status: "eq.approved", published_at: "not.is.null", limit: "500" });
    const response = await fetch(`${config.supabaseUrl}/rest/v1/approved_affiliate_products?${query.toString()}`, { headers: serverHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" });
    const rows = await response.json().catch(() => []);
    if (response.ok && Array.isArray(rows)) uploaded = rows.map((row) => ({ id: String(row.id || ""), merchant: String(row.merchant || "Unknown"), title: String(row.title || "Untitled"), description: String(row.description || ""), affiliateUrl: String(row.affiliate_url || ""), pagePath: row.page_path ? String(row.page_path) : null, removable: true })).filter((item) => item.id && item.affiliateUrl);
  }
  const items = [...builtIn, ...uploaded];
  const uniqueUrls = Array.from(new Set(items.map((item) => item.affiliateUrl).filter(Boolean)));
  const linkResults = new Map<string, { status: number; broken: boolean }>();
  for (let index = 0; index < uniqueUrls.length; index += 12) {
    const group = uniqueUrls.slice(index, index + 12);
    const results = await Promise.all(group.map((url) => checkLink(url)));
    group.forEach((url, resultIndex) => linkResults.set(url, results[resultIndex]));
  }
  const candidates = items.flatMap((item) => {
    const expired = expiredDate(item.description);
    const link = linkResults.get(item.affiliateUrl);
    if (!expired && !link?.broken) return [];
    return [{ ...item, reason: expired ? `Event date passed: ${expired.toLocaleDateString("en-US")}` : `Merchant link returned ${link?.status}`, kind: expired ? "expired_event" : "missing_listing" }];
  });
  return NextResponse.json({ checkedAt: new Date().toISOString(), checkedCount: items.length, brandCount: new Set(items.map((item) => item.merchant)).size, candidates, message: candidates.length ? `${candidates.length} item${candidates.length === 1 ? "" : "s"} need your review.` : "No definitely expired or missing items were found." });
}
