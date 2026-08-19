import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const DEFAULT_BUDGET_USD = 5;
const DEFAULT_LOOKBACK_DAYS = 30;
const MAX_PAGES = 12;

type CostResult = {
  amount?: { currency?: string; value?: number } | null;
  api_key_id?: string | null;
  line_item?: string | null;
  project_id?: string | null;
};

type CostBucket = {
  start_time?: number;
  end_time?: number;
  results?: CostResult[];
};

type CostsResponse = {
  data?: CostBucket[];
  has_more?: boolean;
  next_page?: string | null;
  error?: { message?: string } | null;
};

type FeatureUsageRow = {
  feature?: "leads" | "ads";
  estimated_cost_usd?: number | string | null;
};

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function addAmount(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) || 0) + value);
}

function supabaseHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function featureSpend(startTime: number) {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return { leadsUsd: 0, adsUsd: 0, trackingAvailable: false };
  const since = new Date(startTime * 1000).toISOString();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/openai_feature_usage?select=feature,estimated_cost_usd&created_at=gte.${encodeURIComponent(since)}&limit=10000`,
    { headers: supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" },
  );
  const rows = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(rows)) {
    console.error("Could not load WASCIK OpenAI feature ledger", response.status, rows);
    return { leadsUsd: 0, adsUsd: 0, trackingAvailable: false };
  }
  let leadsUsd = 0;
  let adsUsd = 0;
  for (const row of rows as FeatureUsageRow[]) {
    const value = Number(row.estimated_cost_usd || 0);
    if (!Number.isFinite(value) || value < 0) continue;
    if (row.feature === "leads") leadsUsd += value;
    if (row.feature === "ads") adsUsd += value;
  }
  return { leadsUsd, adsUsd, trackingAvailable: true };
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminKey = process.env.OPENAI_ADMIN_API_KEY?.trim();
  if (!adminKey) return NextResponse.json({ error: "OpenAI Admin API key is not configured." }, { status: 503 });

  const requestUrl = new URL(request.url);
  const requestedDays = Number(requestUrl.searchParams.get("days") || DEFAULT_LOOKBACK_DAYS);
  const days = Number.isFinite(requestedDays) ? Math.min(180, Math.max(1, Math.round(requestedDays))) : DEFAULT_LOOKBACK_DAYS;
  const budgetUsd = positiveNumber(process.env.OPENAI_WORKING_BUDGET_USD, DEFAULT_BUDGET_USD);
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - days * 24 * 60 * 60;

  const byLineItem = new Map<string, number>();
  const byProject = new Map<string, number>();
  const byApiKey = new Map<string, number>();
  let totalUsd = 0;
  let page: string | null = null;
  let pagesRead = 0;

  do {
    const params = new URLSearchParams({ start_time: String(startTime), end_time: String(endTime), bucket_width: "1d", limit: "180" });
    params.append("group_by[]", "project_id");
    params.append("group_by[]", "line_item");
    params.append("group_by[]", "api_key_id");
    if (page) params.set("page", page);

    const response = await fetch(`https://api.openai.com/v1/organization/costs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${adminKey}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as CostsResponse;
    if (!response.ok) {
      console.error("OpenAI organization costs error", response.status, payload);
      return NextResponse.json({ error: payload.error?.message || "Could not load OpenAI organization costs." }, { status: 502 });
    }

    for (const bucket of payload.data || []) {
      for (const result of bucket.results || []) {
        const currency = result.amount?.currency?.toLowerCase();
        const value = Number(result.amount?.value || 0);
        if (currency !== "usd" || !Number.isFinite(value) || value < 0) continue;
        totalUsd += value;
        addAmount(byLineItem, result.line_item || "unclassified", value);
        addAmount(byProject, result.project_id || "unclassified", value);
        addAmount(byApiKey, result.api_key_id || "unclassified", value);
      }
    }

    page = payload.has_more && payload.next_page ? payload.next_page : null;
    pagesRead += 1;
  } while (page && pagesRead < MAX_PAGES);

  const feature = await featureSpend(startTime);
  const mapRows = (map: Map<string, number>, keyName: string) => Array.from(map.entries())
    .map(([key, costUsd]) => ({ [keyName]: key, costUsd }))
    .sort((a, b) => Number(b.costUsd) - Number(a.costUsd));

  return NextResponse.json({
    source: "openai-organization-costs",
    authoritativeSpend: true,
    lookbackDays: days,
    startTime,
    endTime,
    totalUsd,
    workingBudgetUsd: budgetUsd,
    calculatedRemainingUsd: Math.max(0, budgetUsd - totalUsd),
    budgetUsedPercent: budgetUsd > 0 ? Math.min(100, (totalUsd / budgetUsd) * 100) : 0,
    leadsUsd: feature.leadsUsd,
    adsUsd: feature.adsUsd,
    leadsUsedPercent: budgetUsd > 0 ? Math.min(100, (feature.leadsUsd / budgetUsd) * 100) : 0,
    adsUsedPercent: budgetUsd > 0 ? Math.min(100, (feature.adsUsd / budgetUsd) * 100) : 0,
    featureTrackingAvailable: feature.trackingAvailable,
    featureTrackingNote: "Lead and Ads gauges use the WASCIK feature ledger from the time feature tracking was enabled. The Overall gauge uses OpenAI organization costs and may include other API activity.",
    budgetNote: "Remaining is calculated from the configured WASCIK working budget minus organization costs in this reporting window; it is not OpenAI prepaid-credit balance data.",
    byLineItem: mapRows(byLineItem, "lineItem"),
    byProject: mapRows(byProject, "projectId"),
    byApiKey: mapRows(byApiKey, "apiKeyId"),
    complete: !page,
  });
}
