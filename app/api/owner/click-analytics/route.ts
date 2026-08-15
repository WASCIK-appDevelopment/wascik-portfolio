import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function supabaseHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const headers = supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind);
  const [clickResponse, visitResponse] = await Promise.all([
    fetch(`${config.supabaseUrl}/rest/v1/affiliate_click_events?select=id,created_at,session_id,merchant,item_label,source_path,destination_host&order=created_at.desc&limit=500`, { headers, cache: "no-store" }),
    fetch(`${config.supabaseUrl}/rest/v1/site_visit_events?select=id,created_at,session_id,path&path=eq.%2F&order=created_at.desc&limit=1000`, { headers, cache: "no-store" }),
  ]);

  const events = await clickResponse.json().catch(() => []);
  const visits = await visitResponse.json().catch(() => []);
  if (!clickResponse.ok || !Array.isArray(events)) return NextResponse.json({ error: "Could not load click analytics" }, { status: 502 });
  if (!visitResponse.ok || !Array.isArray(visits)) return NextResponse.json({ error: "Could not load portfolio visits" }, { status: 502 });

  const byMerchant = new Map<string, number>();
  const bySource = new Map<string, number>();
  const byItem = new Map<string, number>();
  for (const event of events) {
    const merchant = event.merchant || event.destination_host || "Unknown";
    const source = event.source_path || "/";
    const item = event.item_label || "General merchant link";
    byMerchant.set(merchant, (byMerchant.get(merchant) || 0) + 1);
    bySource.set(source, (bySource.get(source) || 0) + 1);
    byItem.set(item, (byItem.get(item) || 0) + 1);
  }

  const top = (map: Map<string, number>) => [...map.entries()].sort((a,b) => b[1]-a[1]).slice(0, 10).map(([label,count]) => ({ label, count }));
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const last24h = events.filter((event) => now - new Date(event.created_at).getTime() <= day).length;
  const last7d = events.filter((event) => now - new Date(event.created_at).getTime() <= day * 7).length;
  const portfolio24h = visits.filter((event) => now - new Date(event.created_at).getTime() <= day).length;
  const portfolio7d = visits.filter((event) => now - new Date(event.created_at).getTime() <= day * 7).length;

  return NextResponse.json({
    totalClicks: events.length,
    last24h,
    last7d,
    uniqueSessions: new Set(events.map((event) => event.session_id).filter(Boolean)).size,
    portfolioVisits: visits.length,
    portfolioVisits24h: portfolio24h,
    portfolioVisits7d: portfolio7d,
    portfolioUniqueSessions: new Set(visits.map((event) => event.session_id).filter(Boolean)).size,
    topMerchants: top(byMerchant),
    topSources: top(bySource),
    topItems: top(byItem),
    recent: events.slice(0, 50),
  });
}
