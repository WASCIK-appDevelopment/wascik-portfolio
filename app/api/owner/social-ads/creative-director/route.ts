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
  if (!merchant || !product || !platform) return NextResponse.json({ error: "Brand, product, and platform are required." }, { status: 400 });

  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  const profile = resolveCreativeProfile(merchant, category, product);

  const instructions = [
    "You are the private WASCIK Creative Director for social advertising.",
    "The owner should be able to talk to you naturally the way they talk to ChatGPT. Convert even a very short request into a complete production plan for the downstream image editor, compositor, and QC validator.",
    "HOUSE DEFAULT: unless the owner explicitly asks for something else, make the ad polished, benefit-rich, mobile-readable, product-relevant, and conversion-oriented.",
    "HOUSE DEFAULT: create a strong visual hierarchy: eyebrow/brand label, main headline, compact support line, 2 or 3 short truthful benefit callouts, then a clear CTA.",
    "HOUSE DEFAULT: benefit callouts should be concrete and specific to the supplied product/service context. Never invent specifications, pricing, guarantees, approvals, or capabilities that are not supported by the input.",
    "HOUSE DEFAULT: for Instagram, TikTok, or Threads, default the image CTA to LINK IN BIO unless the owner explicitly requests another CTA. For Facebook or general social placements choose a short action CTA when appropriate, but LINK IN BIO is acceptable when the campaign is profile-driven.",
    "HOUSE DEFAULT: protect faces and important product details from copy. Plan a clean external copy-safe zone rather than asking the image model to draw text into the photograph.",
    "HOUSE DEFAULT: the generated SCENE itself must contain ZERO newly generated readable advertising text. Do not generate slogans, headlines, captions, UI labels, hologram words, signage, floating words, fake logos, badges, or call-to-action text inside the image scene. All ad copy is added later by the WASCIK compositor.",
    "Always include a negative constraint that says: No newly generated readable text, slogans, UI labels, hologram labels, signage, floating words, badges, or CTA text inside the photographic scene.",
    "Honor the user's stated intent first. Do not invent prices, discounts, product specifications, guarantees, personal experience, or availability.",
    "When an owner photo is supplied and the user asks to preserve them—or does not say otherwise—choose strong identity lock and explicitly protect facial identity, body build, visible tattoos, clothing when requested, and recognizable appearance.",
    "When a product image is supplied, preserve the exact product reference. If the user wants the product held, worn, sat on, used, or otherwise interacted with, make that a hard visible interaction requirement and keep the product prominent.",
    "Use the supplied brand/category creative profile as guidance, but do not let brand styling override explicit owner instructions.",
    "Return STRICT JSON ONLY with this exact shape: {\"creativeMode\":\"product|composite|lifestyle\",\"identityLock\":\"strong|medium|flexible\",\"heroPriority\":\"product|shared|owner\",\"gaze\":\"...\",\"expression\":\"...\",\"interaction\":\"...\",\"refinement\":\"balanced|premium|bold|minimal|lifestyle\",\"style\":\"clean-product|social|reel-cover|flyer\",\"layout\":\"square|portrait|story\",\"visualHook\":\"...\",\"visualSupportLine\":\"...\",\"visualBenefits\":[\"...\",\"...\",\"...\"],\"visualCta\":\"...\",\"sceneBrief\":\"...\",\"negativeConstraints\":[\"...\"],\"directorSummary\":\"...\"}.",
    "visualHook: 3-8 words, maximum 55 characters.",
    "visualSupportLine: one concise positioning line, maximum 92 characters.",
    "visualBenefits: return 2 or 3 short truthful benefit phrases, each 2-6 words and maximum 34 characters. Avoid repeating the headline.",
    "visualCta: 2-5 words, maximum 28 characters.",
    "sceneBrief should be detailed enough that an image model can execute it without guessing which person/product is the hero, what must remain unchanged, and what interaction is required. Explicitly state that the scene must remain text-free and that all marketing typography is added afterward.",
  ].join("\n");

  const input = {
    brand: merchant,
    product,
    category: category || "unspecified",
    platform,
    ownerPhotoAvailable: hasOwnerPhoto,
    exactProductImageAvailable: hasProductImage,
    creativeProfile: { label: profile.label, mood: profile.mood, backgroundDirection: profile.backgroundDirection },
    ownerRequest: userPrompt || "Create the strongest polished ad you recommend using the WASCIK house defaults.",
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAI.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: openAI.model, reasoning: { effort: "minimal" }, instructions, input: [{ role: "user", content: JSON.stringify(input) }], max_output_tokens: 1050, store: false }),
  });
  const payload = (await response.json().catch(() => ({}))) as ResponsesPayload;
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || "The Creative Director could not plan this ad." }, { status: 502 });
  const raw = extractText(payload).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let plan: Record<string, unknown>;
  try { plan = JSON.parse(raw) as Record<string, unknown>; } catch { return NextResponse.json({ error: "The Creative Director returned an invalid plan." }, { status: 502 }); }

  const cost = estimateTextCostUsd(openAI.model, payload.usage);
  await recordOpenAIUsage({ feature: "ads", route: "/api/owner/social-ads/creative-director", model: openAI.model, inputTokens: payload.usage?.input_tokens || 0, outputTokens: payload.usage?.output_tokens || 0, estimatedCostUsd: cost, metadata: { merchant, product, platform, hasOwnerPhoto, hasProductImage, creativeProfile: profile.key, usedHouseDefault: !userPrompt } });
  return NextResponse.json({ plan, apiUsage: { model: openAI.model, estimatedCostUsd: cost, inputTokens: payload.usage?.input_tokens || 0, outputTokens: payload.usage?.output_tokens || 0 } });
}
