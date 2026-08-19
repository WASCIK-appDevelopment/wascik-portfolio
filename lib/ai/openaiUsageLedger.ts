import { getStage6Config } from "./stage6Config";

export type OpenAIFeature = "leads" | "ads";

type UsagePayload = {
  input_tokens?: number;
  output_tokens?: number;
  input_tokens_details?: { cached_tokens?: number };
};

const TEXT_PRICING_PER_MILLION: Record<string, { input: number; cachedInput: number; output: number }> = {
  "gpt-5-mini": { input: 0.25, cachedInput: 0.025, output: 2.0 },
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, cachedInput: 0.02, output: 1.25 },
};

export function estimateTextCostUsd(model: string, usage?: UsagePayload) {
  const pricing = TEXT_PRICING_PER_MILLION[model];
  if (!pricing || !usage) return null;
  const input = Math.max(0, Number(usage.input_tokens || 0));
  const output = Math.max(0, Number(usage.output_tokens || 0));
  const cached = Math.min(input, Math.max(0, Number(usage.input_tokens_details?.cached_tokens || 0)));
  const uncached = input - cached;
  return ((uncached * pricing.input) + (cached * pricing.cachedInput) + (output * pricing.output)) / 1_000_000;
}

function supabaseHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function recordOpenAIUsage(input: {
  feature: OpenAIFeature;
  route: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number | null;
  metadata?: Record<string, unknown>;
}) {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return { recorded: false, reason: "database_not_configured" };

  const estimatedCostUsd = Number(input.estimatedCostUsd || 0);
  const response = await fetch(`${config.supabaseUrl}/rest/v1/openai_feature_usage`, {
    method: "POST",
    headers: supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind),
    body: JSON.stringify({
      feature: input.feature,
      route: input.route.slice(0, 240),
      model: input.model?.slice(0, 120) || null,
      input_tokens: Math.max(0, Math.round(Number(input.inputTokens || 0))),
      output_tokens: Math.max(0, Math.round(Number(input.outputTokens || 0))),
      estimated_cost_usd: Number.isFinite(estimatedCostUsd) && estimatedCostUsd > 0 ? estimatedCostUsd : 0,
      metadata: input.metadata || {},
    }),
  }).catch(() => null);

  if (!response?.ok) {
    const detail = response ? await response.text().catch(() => "") : "network_error";
    console.error("OpenAI feature usage ledger write failed", response?.status || 0, detail);
    return { recorded: false, reason: "write_failed" };
  }
  return { recorded: true };
}
