import { getStage6Config } from "./ai/stage6Config";

export async function getAffiliateSuppressions() {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return new Set<string>();
  const headers: Record<string, string> = { apikey: config.supabaseServerKey };
  if (config.supabaseKeyKind === "service_role") headers.Authorization = `Bearer ${config.supabaseServerKey}`;
  const response = await fetch(`${config.supabaseUrl}/rest/v1/affiliate_catalog_suppressions?select=product_id&limit=1000`, { headers, cache: "no-store" });
  if (!response.ok) return new Set<string>();
  const rows = await response.json().catch(() => []);
  return new Set(Array.isArray(rows) ? rows.map((row) => String(row.product_id || "")).filter(Boolean) : []);
}
