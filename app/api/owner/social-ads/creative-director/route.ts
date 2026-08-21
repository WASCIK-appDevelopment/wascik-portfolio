import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../../lib/ai/openaiConfig";
import { estimateTextCostUsd, recordOpenAIUsage } from "../../../../../lib/ai/openaiUsageLedger";
import { resolveCreativeProfile } from "../../../../../lib/ai/socialAdCreativeProfile";

const OWNER_HEADER = "x-wascik-owner-key";

type ResponsesPayload = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } };
  error?: { message?: string };
};

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function extractText(payload: ResponsesPayload) {
  return (payload.output || []).flatMap((item) => item.content || []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text || "").join("\n").trim();
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const merchant = clean(body.merchant, 160);
  const product = clean(body.product, 320);
  const category = clean(body.category, 220);
  const platform = clean(body.platform, 80);
  const userPrompt = clean(body.userPrompt, 3000);
  const hasOwnerPhoto = Boolean(body.hasOwnerPhoto);
  const hasProductImage = Boolean(body.hasProductImage);
  if (!merchant || !product || !platform || !userPrompt) return NextResponse.json({ error: "Brand, product, platform, and your creative direction are required." }, { status: 400 });

  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  const profile = resolveCreativeProfile(merchant, category, product);

  const instructions = [
    "You are the private WASCIK Creative Director for social advertising.",
    "The owner should be able to talk to you naturally the way they talk to ChatGPT. Convert their plain-English request into a precise production plan for the downstream image editor, compositor, and QC validator.",
    "Honor the user's stated intent first. Do not invent prices, discounts, product specifications, guarantees, personal experience, or availability.",
    "When an owner photo is supplied and the user asks to preserve them, choose strong identity lock and explicitly protect facial identity, body build, visible tattoos, clothing when requested, and recognizable appearance.",
    "When a product image is supplied, preserve the exact product reference. If the user wants the product held, worn, sat on, used, or otherwise interacted with, make that a hard visible interaction requirement and keep the product prominent.",
    "Plan copy-safe space so headline/support text does not cover the person's face or the product's important details.",
    "Keep visual text concise and campaign-ready. For Instagram, TikTok, or Threads, use LINK IN BIO when appropriate. For other platforms choose a short action CTA such as SEE DETAILS, SHOP NOW, VIEW CATALOG, or LEARN MORE when appropriate.",
    "Use the supplied brand/category creative profile as guidance, but do not let brand styling override explicit owner instructions.",
    "Return STRICT JSON ONLY with this exact shape: {\"creativeMode\":\"product|composite|lifestyle\",\"identityLock\":\"strong|medium|flexible\",\"heroPriority\":\"product|shared|owner\",\"gaze\":\"...\",\"expression\":\"...\",\"interaction\":\"...\",\"refinement\":\"balanced|premium|bold|minimal|lifestyle\",\"style\":\"clean-product|social|reel-cover|flyer\",\"layout\":\"square|portrait|story\",\"visualHook\":\"...\",\"visualSupportLine\":\"...\",\"visualCta\":\"...\",\"sceneBrief\":\"...\",\"negativeConstraints\":[\"...\"],\"directorSummary\":\"...\"}.",
    "visualHook: 3-8 words, maximum 55 characters. visualSupportLine: one concise benefit/positioning line, maximum 90 characters. visualCta: 2-5 words, maximum 28 characters.",
    "sceneBrief should be detailed enough that an image model can execute it without guessing which person/product is the hero, what must remain unchanged, and what interaction is required.",
  ].join("\n");

  const input = {
    brand: merchant,
    product,
    category: category || "unspecified",
    platform,
    ownerPhotoAvailable: hasOwnerPhoto,
    exactProductImageAvailable: hasProductImage,
    creativeProfile: { label: profile.label, mood: profile.mood, backgroundDirection: profile.backgroundDirection },
    ownerRequest: userPrompt,
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAI.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: openAI.model, reasoning: { effort: "minimal" }, instructions, input: [{ role: "user", content: JSON.stringify(input) }], max_output_tokens: 900, store: false }),
  });
  const payload = (await response.json().catch(() => ({}))) as ResponsesPayload;
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || "The Creative Director could not plan this ad." }, { status: 502 });
  const raw = extractText(payload).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let plan: Record<string, unknown>;
  try { plan = JSON.parse(raw) as Record<string, unknown>; } catch { return NextResponse.json({ error: "The Creative Director returned an invalid plan." }, { status: 502 }); }

  const cost = estimateTextCostUsd(openAI.model, payload.usage);
  await recordOpenAIUsage({ feature: "ads", route: "/api/owner/social-ads/creative-director", model: openAI.model, inputTokens: payload.usage?.input_tokens || 0, outputTokens: payload.usage?.output_tokens || 0, estimatedCostUsd: cost, metadata: { merchant, product, platform, hasOwnerPhoto, hasProductImage, creativeProfile: profile.key } });
  return NextResponse.json({ plan, apiUsage: { model: openAI.model, estimatedCostUsd: cost, inputTokens: payload.usage?.input_tokens || 0, outputTokens: payload.usage?.output_tokens || 0 } });
}
