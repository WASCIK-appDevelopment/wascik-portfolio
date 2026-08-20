import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../../lib/ai/openaiConfig";
import { estimateTextCostUsd, recordOpenAIUsage } from "../../../../../lib/ai/openaiUsageLedger";
import { resolveCreativeProfile } from "../../../../../lib/ai/socialAdCreativeProfile";
import { safeAffiliateImageUrl, verifyAffiliateImageSignature } from "../../../../../lib/affiliateImageProxy";

const OWNER_HEADER = "x-wascik-owner-key";
const DEFAULT_MODEL = "gpt-image-1-mini";
const AFFILIATE_IMAGE_PROXY_PATH = "/api/owner/affiliate-search/image";

type EditPayload = {
  data?: Array<{ b64_json?: string; url?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { image_tokens?: number; text_tokens?: number } };
  error?: { message?: string };
};

type VisionPayload = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } };
};

type ValidationResult = {
  pass: boolean;
  identityScore: number;
  productScore: number;
  interactionScore: number;
  heroScore: number;
  faceInTopCopyZone: boolean;
  recommendedCopyZone: "top" | "bottom";
  reasons: string[];
};

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function safeRemoteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}
function verifiedProductImageUrl(value: string, requestUrl: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, requestUrl);
    if (parsed.pathname === AFFILIATE_IMAGE_PROXY_PATH) {
      const original = parsed.searchParams.get("url") || "";
      const signature = parsed.searchParams.get("sig") || "";
      const safe = safeAffiliateImageUrl(original);
      if (!safe || !verifyAffiliateImageSignature(safe.toString(), signature)) return "";
      return safe.toString();
    }
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}
async function fetchImage(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the selected source image.");
  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const bytes = await response.arrayBuffer();
  if (!contentType.startsWith("image/") || bytes.byteLength > 15 * 1024 * 1024) throw new Error("The source image is not usable for AI editing.");
  return { bytes, contentType };
}
function estimateCost(model: string, usage: EditPayload["usage"], quality: string, portrait: boolean) {
  if (model !== DEFAULT_MODEL) return null;
  if (usage) {
    const imageInput = Number(usage.input_tokens_details?.image_tokens || 0);
    const textInput = Number(usage.input_tokens_details?.text_tokens || 0);
    const output = Number(usage.output_tokens || 0);
    if (imageInput || textInput || output) return (imageInput * 2.5 + textInput * 2 + output * 8) / 1_000_000;
  }
  const fallback: Record<string, [number, number]> = { low: [0.005, 0.006], medium: [0.011, 0.015], high: [0.036, 0.052] };
  return fallback[quality]?.[portrait ? 1 : 0] ?? null;
}
function extractVisionText(payload: VisionPayload) {
  return (payload.output || []).flatMap((item) => item.content || []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text || "").join("\n").trim();
}
function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function validateScene(args: {
  apiKey: string;
  validatorModel: string;
  ownerPhotoUrl: string;
  productImageUrl: string;
  generatedImageUrl: string;
  productReferenceIncluded: boolean;
  identityLock: string;
  heroPriority: string;
  interaction: string;
  gaze: string;
  expression: string;
}) {
  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: [
        "You are a strict advertising-image quality-control validator.",
        "Image 1 is the original owner/person reference. Image 2, when present, is the exact product reference. The final image is the generated campaign scene.",
        `Identity lock: ${args.identityLock}. Hero priority: ${args.heroPriority}. Requested interaction: ${args.interaction || "none"}. Gaze: ${args.gaze || "unspecified"}. Expression: ${args.expression || "unspecified"}.`,
        "Judge only visible compliance. Do not be generous. Strong identity lock requires the generated person's face and overall appearance to remain very close to Image 1, not merely a similar person.",
        "If a product reference exists, the exact product must remain recognizable. For product/shared hero priority, it must be visually prominent rather than a tiny background detail.",
        "If a hold/use/wear/sit interaction is requested, the final image must visibly show that exact interaction. Merely placing the product nearby fails.",
        "Also determine whether the person's face overlaps the upper 30% copy-safe zone. Recommend TOP only when the upper zone is genuinely clear of the face; otherwise recommend BOTTOM.",
        "Return STRICT JSON ONLY: {\"pass\":true|false,\"identityScore\":0-100,\"productScore\":0-100,\"interactionScore\":0-100,\"heroScore\":0-100,\"faceInTopCopyZone\":true|false,\"recommendedCopyZone\":\"top\"|\"bottom\",\"reasons\":[\"short concrete failure reason\"]}.",
      ].join("\n"),
    },
    { type: "input_text", text: "IMAGE 1 — ORIGINAL OWNER REFERENCE" },
    { type: "input_image", image_url: args.ownerPhotoUrl, detail: "high" },
  ];
  if (args.productReferenceIncluded && args.productImageUrl) {
    content.push({ type: "input_text", text: "IMAGE 2 — EXACT PRODUCT REFERENCE" });
    content.push({ type: "input_image", image_url: args.productImageUrl, detail: "high" });
  }
  content.push({ type: "input_text", text: "FINAL IMAGE — GENERATED CAMPAIGN SCENE" });
  content.push({ type: "input_image", image_url: args.generatedImageUrl, detail: "high" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: args.validatorModel,
      reasoning: { effort: "minimal" },
      input: [{ role: "user", content }],
      max_output_tokens: 350,
      store: false,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as VisionPayload;
  if (!response.ok) throw new Error("The generated scene could not be quality-checked.");
  const raw = extractVisionText(payload).replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(raw); } catch { throw new Error("The scene validator returned an invalid result."); }

  const identityScore = clampScore(parsed.identityScore);
  const productScore = args.productReferenceIncluded ? clampScore(parsed.productScore) : 100;
  const interactionScore = clampScore(parsed.interactionScore);
  const heroScore = args.productReferenceIncluded ? clampScore(parsed.heroScore) : 100;
  const identityMinimum = args.identityLock === "strong" ? 88 : args.identityLock === "medium" ? 78 : 65;
  const requiresInteraction = Boolean(args.interaction && args.interaction !== "Preserve original pose");
  const interactionMinimum = requiresInteraction ? 80 : 60;
  const heroMinimum = args.heroPriority === "owner" ? 65 : 78;
  const reasons = Array.isArray(parsed.reasons) ? parsed.reasons.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 220)).slice(0, 6) : [];
  if (identityScore < identityMinimum) reasons.push(`Identity similarity ${identityScore}/100 is below required ${identityMinimum}.`);
  if (args.productReferenceIncluded && productScore < 78) reasons.push(`Product fidelity ${productScore}/100 is too low.`);
  if (args.productReferenceIncluded && heroScore < heroMinimum) reasons.push(`Product/hero prominence ${heroScore}/100 is too low.`);
  if (requiresInteraction && interactionScore < interactionMinimum) reasons.push(`Requested interaction score ${interactionScore}/100 is too low.`);
  const faceInTopCopyZone = Boolean(parsed.faceInTopCopyZone);
  const recommendedCopyZone = parsed.recommendedCopyZone === "bottom" || faceInTopCopyZone ? "bottom" : "top";
  const pass = identityScore >= identityMinimum && productScore >= 78 && heroScore >= heroMinimum && (!requiresInteraction || interactionScore >= interactionMinimum);
  return {
    validation: { pass, identityScore, productScore, interactionScore, heroScore, faceInTopCopyZone, recommendedCopyZone, reasons: Array.from(new Set(reasons)).slice(0, 6) } as ValidationResult,
    usage: payload.usage,
  };
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ownerPhotoUrl = safeRemoteUrl(clean(body.ownerPhotoUrl, 4000));
  const productImageUrl = verifiedProductImageUrl(clean(body.productImageUrl, 4000), request.url);
  const merchant = clean(body.merchant, 140);
  const product = clean(body.product, 280);
  const category = clean(body.category, 180);
  const gaze = clean(body.gaze, 100);
  const expression = clean(body.expression, 100);
  const interaction = clean(body.interaction, 160);
  const directions = clean(body.directions, 1400);
  const creativeMode = ["product", "composite", "lifestyle"].includes(body.creativeMode) ? body.creativeMode : "composite";
  const refinement = ["balanced", "premium", "bold", "minimal", "lifestyle"].includes(body.refinement) ? body.refinement : "balanced";
  const identityLock = ["strong", "medium", "flexible"].includes(body.identityLock) ? body.identityLock : "strong";
  const heroPriority = ["product", "shared", "owner"].includes(body.heroPriority) ? body.heroPriority : "shared";
  const quality = ["low", "medium", "high"].includes(body.quality) ? body.quality : "low";
  const layout = ["square", "portrait", "story"].includes(body.layout) ? body.layout : "portrait";
  if (!ownerPhotoUrl || !merchant || !product) return NextResponse.json({ error: "Select a saved owner photo and product/service first." }, { status: 400 });

  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  const model = process.env.OPENAI_IMAGE_EDIT_MODEL?.trim() || DEFAULT_MODEL;
  const validatorModel = process.env.OPENAI_IMAGE_VALIDATOR_MODEL?.trim() || openAI.model;
  const size = layout === "square" ? "1024x1024" : "1024x1536";
  const profile = resolveCreativeProfile(merchant, category, product);
  const maxAttempts = identityLock === "strong" ? 3 : 2;

  try {
    const owner = await fetchImage(ownerPhotoUrl);
    let productReference: { bytes: ArrayBuffer; contentType: string } | null = null;
    if (productImageUrl) {
      try { productReference = await fetchImage(productImageUrl); } catch { productReference = null; }
    }
    const productReferenceIncluded = Boolean(productReference);

    const formatDirection = layout === "story"
      ? "Compose for a tall 9:16 social story frame. Keep the subject and product comfortably inside the frame with breathing room."
      : layout === "square"
        ? "Compose for a square social campaign frame with a strong central visual balance."
        : "Compose for a 4:5 portrait social advertisement with editorial vertical balance.";

    const identityDirection = identityLock === "strong"
      ? "IDENTITY LOCK — STRONG. The FIRST image is the non-negotiable identity source of truth. Preserve the same recognizable person: facial geometry, head shape, baldness/hairline, eyes, eyebrows, nose, mouth, jaw, facial hair, skin tone, apparent age, tattoos when visible, body build and proportions. Do not beautify, age, de-age, masculinize, feminize, slim, bulk up, or redesign the face. If a scene or pose request conflicts with identity fidelity, preserve identity and simplify the scene instead."
      : identityLock === "medium"
        ? "IDENTITY LOCK — MEDIUM. Preserve the person's recognizable face, body build, skin tone, facial hair and major distinguishing features while allowing modest pose and expression changes."
        : "IDENTITY LOCK — FLEXIBLE. Keep the person recognizably based on the first reference while allowing broader art-direction changes.";

    const heroDirection = heroPriority === "product"
      ? "HERO PRIORITY — PRODUCT. The exact advertised product must be one of the dominant visual subjects, clearly recognizable, prominently sized, unobstructed in its important features, and visually impossible to miss. The owner supports the product rather than overpowering it."
      : heroPriority === "owner"
        ? "HERO PRIORITY — OWNER. The owner is the primary visual subject, but the exact product must still be clearly recognizable and intentionally present when a product reference is supplied."
        : "HERO PRIORITY — SHARED. Treat the owner and exact product as co-heroes. Both must be immediately visible and important at first glance; neither may be reduced to a tiny background detail or incidental prop.";

    const interactionDirection = interaction === "Preserve original pose"
      ? "POSE LOCK. Preserve the owner's original pose and body orientation as closely as practical. Do not reinterpret 'preserve original' as permission to redesign the person or substitute a different pose. Integrate the product around that preserved person/pose when possible."
      : interaction
        ? `PRODUCT INTERACTION — REQUIRED: ${interaction}. This is a primary composition requirement, not an optional suggestion. Make the interaction obvious, physically plausible, and clearly visible. If the instruction says hold/use/wear/sit on the product, visibly show that exact interaction.`
        : "";

    let retryFeedback = "";
    let finalImageDataUrl = "";
    let finalValidation: ValidationResult | null = null;
    let totalImageCost = 0;
    let totalValidationCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attemptsUsed = attempt;
      const form = new FormData();
      form.append("model", model); form.append("size", size); form.append("quality", quality); form.append("output_format", "png");
      form.append("image[]", new Blob([owner.bytes], { type: owner.contentType }), `owner.${owner.contentType.includes("png") ? "png" : "jpg"}`);
      if (productReference) form.append("image[]", new Blob([productReference.bytes], { type: productReference.contentType }), `product.${productReference.contentType.includes("png") ? "png" : "jpg"}`);

      const prompt = [
        "Create one cohesive, photorealistic, campaign-ready advertising scene from the supplied references.",
        identityDirection,
        "The FIRST image is the owner/person reference. Do not replace the person with a similar-looking substitute.",
        productReferenceIncluded ? "The SECOND image is the exact advertised product reference. Preserve its recognizable form, proportions, materials and design. Do not replace it with an invented or approximate product." : `Advertising context: ${merchant} — ${product}. Do not invent logos or readable packaging text.`,
        heroDirection,
        `Creative profile: ${profile.label}; mood: ${profile.mood}.`,
        `Ad mode: ${creativeMode}. Refinement: ${refinement}.`,
        formatDirection,
        "IMPORTANT COMPOSITION RULE: make the result look like ONE photograph or one professionally art-directed campaign scene. Never place the owner or product inside a separate rectangular photo, floating card, inset panel, split-screen tile, picture-in-picture frame, phone mockup, or dashboard box.",
        "The person must belong naturally in the environment with consistent perspective, lighting, shadows, scale, depth of field and contact with nearby furniture or products.",
        creativeMode === "lifestyle" && productReferenceIncluded ? "For lifestyle mode, integrate the owner and exact product into a believable real-world use scene. The product must remain a major campaign subject, not a small incidental background object." : "",
        creativeMode === "composite" && productReferenceIncluded ? "For composite mode, use sophisticated editorial depth and overlap while keeping both owner and product visually important and clearly recognizable." : "",
        "Leave either the upper 30% OR lower 22% visually calm enough for external ad copy. Prefer keeping the owner's face and critical product details away from the upper 30% when natural composition allows.",
        gaze === "Preserve original" ? "GAZE LOCK. Preserve the original eye direction from the first image." : gaze ? `Gaze: ${gaze}. When 'Look at viewer', direct both eyes naturally toward the camera/viewer while preserving facial identity.` : "",
        expression === "Preserve original" ? "EXPRESSION LOCK. Preserve the original facial expression from the first image." : expression ? `Expression: ${expression}. Make the expression visibly match this direction without changing the person's identity.` : "",
        interactionDirection,
        directions ? `Specific owner directions: ${directions}.` : "",
        retryFeedback ? `QUALITY-CONTROL RETRY FEEDBACK FROM THE PRIOR ATTEMPT — CORRECT EVERY ITEM: ${retryFeedback}` : "",
        `Visual environment direction: ${profile.backgroundDirection}.`,
        "Use premium advertising photography, believable materials, natural anatomy and realistic hands. Avoid duplicate people or duplicate products unless explicitly requested.",
        "Do not add ad copy, captions, prices, badges, watermarks, logos or extra readable text. Exact typography and CTA are added afterward by the WASCIK compositor.",
      ].filter(Boolean).join("\n");
      form.append("prompt", prompt);

      const response = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${openAI.apiKey}` }, body: form });
      const payload = (await response.json().catch(() => ({}))) as EditPayload;
      if (!response.ok) {
        console.error("Owner image edit error", response.status, payload);
        if (attempt === maxAttempts) return NextResponse.json({ error: payload.error?.message || "The owner photo could not be edited." }, { status: 502 });
        retryFeedback = "The previous image generation failed technically. Produce a clean valid image on this attempt.";
        continue;
      }
      const image = payload.data?.[0];
      if (!image?.b64_json && !image?.url) {
        if (attempt === maxAttempts) return NextResponse.json({ error: "The image editor returned no image." }, { status: 502 });
        retryFeedback = "The previous attempt returned no usable image. Produce one valid campaign image.";
        continue;
      }
      const imageDataUrl = image.b64_json ? `data:image/png;base64,${image.b64_json}` : image.url || "";
      const attemptImageCost = estimateCost(model, payload.usage, quality, size !== "1024x1024");
      if (typeof attemptImageCost === "number") totalImageCost += attemptImageCost;
      totalInputTokens += payload.usage?.input_tokens || 0;
      totalOutputTokens += payload.usage?.output_tokens || 0;

      const checked = await validateScene({
        apiKey: openAI.apiKey,
        validatorModel,
        ownerPhotoUrl,
        productImageUrl,
        generatedImageUrl: imageDataUrl,
        productReferenceIncluded,
        identityLock,
        heroPriority,
        interaction,
        gaze,
        expression,
      });
      const validatorCost = estimateTextCostUsd(validatorModel, checked.usage);
      if (typeof validatorCost === "number") totalValidationCost += validatorCost;
      totalInputTokens += checked.usage?.input_tokens || 0;
      totalOutputTokens += checked.usage?.output_tokens || 0;
      finalValidation = checked.validation;
      finalImageDataUrl = imageDataUrl;

      if (checked.validation.pass) break;
      retryFeedback = checked.validation.reasons.length ? checked.validation.reasons.join(" | ") : "Identity, product prominence, or required interaction did not meet quality thresholds.";
    }

    if (!finalImageDataUrl || !finalValidation) return NextResponse.json({ error: "The intelligent scene could not be produced." }, { status: 502 });
    if (!finalValidation.pass) {
      await recordOpenAIUsage({
        feature: "ads",
        route: "/api/owner/social-ads/owner-edit",
        model,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        estimatedCostUsd: totalImageCost + totalValidationCost,
        metadata: { merchant, product, attemptsUsed, passedValidation: false, identityLock, heroPriority, productReferenceIncluded, validation: finalValidation },
      });
      return NextResponse.json({
        error: `The AI tried ${attemptsUsed} time${attemptsUsed === 1 ? "" : "s"}, but the scene still did not meet the required identity/product quality. Nothing was accepted.`,
        validation: finalValidation,
        attemptsUsed,
        estimatedCostUsd: totalImageCost + totalValidationCost,
      }, { status: 422 });
    }

    await recordOpenAIUsage({
      feature: "ads",
      route: "/api/owner/social-ads/owner-edit",
      model,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      estimatedCostUsd: totalImageCost + totalValidationCost,
      metadata: { merchant, product, gaze, expression, interaction, productReferenceIncluded, quality, size, creativeMode, refinement, identityLock, heroPriority, creativeProfile: profile.key, attemptsUsed, passedValidation: true, validation: finalValidation },
    });

    return NextResponse.json({
      imageDataUrl: finalImageDataUrl,
      model,
      estimatedCostUsd: totalImageCost + totalValidationCost,
      imageGenerationCostUsd: totalImageCost,
      validationCostUsd: totalValidationCost,
      productReferenceIncluded,
      creativeProfile: profile,
      creativeMode,
      refinement,
      identityLock,
      heroPriority,
      attemptsUsed,
      validation: finalValidation,
      recommendedCopyZone: finalValidation.recommendedCopyZone,
      mode: "validated-multi-pass-owner-product-scene",
    });
  } catch (error) {
    console.error("Owner image edit failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The owner photo could not be edited." }, { status: 502 });
  }
}
