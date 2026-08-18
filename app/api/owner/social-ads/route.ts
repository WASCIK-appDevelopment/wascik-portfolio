import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";

const OWNER_HEADER = "x-wascik-owner-key";

type ResponsesPayload = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
};

const TEXT_PRICING_PER_MILLION: Record<string, { input: number; cachedInput: number; output: number }> = {
  "gpt-5-mini": { input: 0.25, cachedInput: 0.025, output: 2.0 },
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, cachedInput: 0.02, output: 1.25 },
};

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function extractResponseText(payload: ResponsesPayload) {
  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function requestCostUsd(model: string, usage?: ResponsesPayload["usage"]) {
  const pricing = TEXT_PRICING_PER_MILLION[model];
  if (!pricing || !usage) return null;
  const input = Math.max(0, Number(usage.input_tokens || 0));
  const output = Math.max(0, Number(usage.output_tokens || 0));
  const cached = Math.min(input, Math.max(0, Number(usage.input_tokens_details?.cached_tokens || 0)));
  const uncached = input - cached;
  return ((uncached * pricing.input) + (cached * pricing.cachedInput) + (output * pricing.output)) / 1_000_000;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const platform = typeof body.platform === "string" ? body.platform.trim().slice(0, 80) : "";
  const merchant = typeof body.merchant === "string" ? body.merchant.trim().slice(0, 120) : "";
  const product = typeof body.product === "string" ? body.product.trim().slice(0, 240) : "";
  const affiliateUrl = typeof body.affiliateUrl === "string" ? body.affiliateUrl.trim().slice(0, 1500) : "";
  const objective = typeof body.objective === "string" ? body.objective.trim().slice(0, 240) : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1800) : "";

  if (!platform || !merchant || !product) {
    return NextResponse.json({ error: "Platform, merchant, and product are required." }, { status: 400 });
  }

  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) {
    return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  }

  const instructions = [
    "You are the private WASCIK Social & Advertising drafting assistant.",
    "Create accurate affiliate promotional copy using only the owner-supplied facts.",
    "Do not invent prices, discounts, specifications, availability, warranties, medical claims, customer results, or personal use claims.",
    "Never say WASCIK personally uses or endorses a product unless the owner explicitly supplied that fact.",
    "Preserve affiliate compliance: make the commercial relationship clear and do not disguise the destination or tracking link.",
    "If the notes contain uncertain claims, omit them rather than strengthening them.",
    "Return concise content suitable for the named platform.",
    "EVERY generated ad must include a clear final invitation to subscribe for future WASCIK Affiliate Services email deals, product updates, and recommendations. Do not imply the person is subscribed until they actively submit their email.",
    "The subscription invitation should fit naturally into primaryCopy and should direct interested people to subscribe through WASCIK Affiliate Services or the relevant WASCIK affiliate brand page.",
    "OUTPUT FORMAT IS STRICT JSON ONLY with this shape: {\"primaryCopy\":\"...\",\"headline\":\"...\",\"cta\":\"...\",\"hashtags\":[\"...\"],\"complianceNotes\":[\"...\"]}.",
    "The CTA should normally direct people to the supplied affiliate link or to the link in bio when that fits the platform; the email-subscription invitation is an additional opt-in invitation, not a replacement for the product CTA.",
    "Keep hashtags relevant and restrained. Avoid spammy tag stuffing.",
  ].join("\n");

  const input = {
    platform,
    merchant,
    product,
    affiliateUrl: affiliateUrl || "not supplied",
    objective: objective || "Drive qualified product interest and affiliate clicks",
    notes: notes || "No additional product claims supplied",
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAI.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAI.model,
      instructions,
      input: [{ role: "user", content: JSON.stringify(input) }],
      reasoning: { effort: "minimal" },
      max_output_tokens: 700,
      store: false,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as ResponsesPayload;
  if (!response.ok) {
    console.error("Owner social ads OpenAI error", response.status, data);
    return NextResponse.json({ error: "The Social & Advertising assistant could not draft content right now." }, { status: 502 });
  }

  const raw = extractResponseText(data);
  if (!raw) return NextResponse.json({ error: "The drafting assistant returned an empty response." }, { status: 502 });

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const cost = requestCostUsd(openAI.model, data.usage);
    return NextResponse.json({
      ...parsed,
      apiUsage: {
        model: openAI.model,
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        estimatedCostUsd: cost,
      },
    });
  } catch {
    return NextResponse.json({ error: "The drafting assistant returned an invalid response." }, { status: 502 });
  }
}
