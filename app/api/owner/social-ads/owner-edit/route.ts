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

type ImageBytes = { bytes: ArrayBuffer; contentType: string };

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
  } catch { return ""; }
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
  } catch { return ""; }
}
async function fetchImage(url: string): Promise<ImageBytes> {
  if (url.startsWith("data:image/")) {
    const match = url.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!match) throw new Error("The generated image data is not usable.");
    const buffer = Buffer.from(match[2], "base64");
    return { bytes: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), contentType: match[1] };
  }
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the selected source image.");
  const contentType = response.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const bytes = await response.arrayBuffer();
  if (!contentType.startsWith("image/") || bytes.byteLength > 15 * 1024 * 1024) throw new Error("The source image is not usable for AI editing.");
  return { bytes, contentType };
}
function estimateImageCost(model: string, usage: EditPayload["usage"], quality: string, portrait: boolean) {
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
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
}
function extension(contentType: string) { return contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"; }
function imageData(payload: EditPayload) {
  const image = payload.data?.[0];
  return image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url || "";
}

async function callImageEdit(args: { apiKey: string; model: string; size: string; quality: string; images: ImageBytes[]; prompt: string }) {
  const form = new FormData();
  form.append("model", args.model); form.append("size", args.size); form.append("quality", args.quality); form.append("output_format", "png");
  args.images.forEach((image, index) => form.append("image[]", new Blob([image.bytes], { type: image.contentType }), `reference-${index + 1}.${extension(image.contentType)}`));
  form.append("prompt", args.prompt);
  const response = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${args.apiKey}` }, body: form });
  const payload = (await response.json().catch(() => ({}))) as EditPayload;
  if (!response.ok) throw new Error(payload.error?.message || "The image editor could not complete this pass.");
  const dataUrl = imageData(payload);
  if (!dataUrl) throw new Error("The image editor returned no image.");
  return { dataUrl, usage: payload.usage };
}

async function validateScene(args: {
  apiKey: string; validatorModel: string; ownerPhotoUrl: string; productImageUrl: string; generatedImageUrl: string;
  productReferenceIncluded: boolean; identityLock: string; heroPriority: string; interaction: string; gaze: string; expression: string;
}) {
  const content: Array<Record<string, unknown>> = [
    { type: "input_text", text: [
      "You are a strict advertising-image quality-control validator.",
      "Image 1 is the original owner/person reference. Image 2, when present, is the exact product reference. The final image is the generated campaign scene.",
      `Identity lock: ${args.identityLock}. Hero priority: ${args.heroPriority}. Requested interaction: ${args.interaction || "none"}. Gaze: ${args.gaze || "unspecified"}. Expression: ${args.expression || "unspecified"}.`,
      "Judge only visible compliance. Strong identity lock requires the generated person's face and overall appearance to remain very close to Image 1, not merely a similar person.",
      "If a product reference exists, the exact product must remain recognizable. For product/shared hero priority, it must be visually prominent rather than a tiny background detail.",
      "If a hold/use/wear/sit interaction is requested, the final image must visibly show that exact interaction. Merely placing the product nearby fails.",
      "Determine whether the person's face overlaps the upper 30% copy-safe zone. Recommend TOP only when the upper zone is genuinely clear of the face; otherwise recommend BOTTOM.",
      "Return STRICT JSON ONLY: {\"pass\":true|false,\"identityScore\":0-100,\"productScore\":0-100,\"interactionScore\":0-100,\"heroScore\":0-100,\"faceInTopCopyZone\":true|false,\"recommendedCopyZone\":\"top\"|\"bottom\",\"reasons\":[\"short concrete failure reason\"]}."
    ].join("\n") },
    { type: "input_text", text: "IMAGE 1 — ORIGINAL OWNER REFERENCE" },
    { type: "input_image", image_url: args.ownerPhotoUrl, detail: "high" },
  ];
  if (args.productReferenceIncluded && args.productImageUrl) {
    content.push({ type: "input_text", text: "IMAGE 2 — EXACT PRODUCT REFERENCE" }, { type: "input_image", image_url: args.productImageUrl, detail: "high" });
  }
  content.push({ type: "input_text", text: "FINAL IMAGE — GENERATED CAMPAIGN SCENE" }, { type: "input_image", image_url: args.generatedImageUrl, detail: "high" });
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST", headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: args.validatorModel, reasoning: { effort: "minimal" }, input: [{ role: "user", content }], max_output_tokens: 350, store: false }),
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
  return { validation: { pass, identityScore, productScore, interactionScore, heroScore, faceInTopCopyZone, recommendedCopyZone, reasons: Array.from(new Set(reasons)).slice(0, 6) } as ValidationResult, usage: payload.usage };
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ownerPhotoUrl = safeRemoteUrl(clean(body.ownerPhotoUrl, 4000));
  const productImageUrl = verifiedProductImageUrl(clean(body.productImageUrl, 4000), request.url);
  const merchant = clean(body.merchant, 140); const product = clean(body.product, 280); const category = clean(body.category, 180);
  const gaze = clean(body.gaze, 100); const expression = clean(body.expression, 100); const interaction = clean(body.interaction, 160); const directions = clean(body.directions, 1400);
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

  try {
    const owner = await fetchImage(ownerPhotoUrl);
    let productReference: ImageBytes | null = null;
    if (productImageUrl) { try { productReference = await fetchImage(productImageUrl); } catch { productReference = null; } }
    const productReferenceIncluded = Boolean(productReference);
    const formatDirection = layout === "story" ? "Compose for a tall 9:16 social story frame." : layout === "square" ? "Compose for a square social campaign frame." : "Compose for a 4:5 portrait social advertisement.";
    const identityDirection = identityLock === "strong"
      ? "IDENTITY LOCK — STRONG. The owner reference is non-negotiable. Preserve facial geometry, head shape, hairline/baldness, eyes, eyebrows, nose, mouth, jaw, facial hair, skin tone, apparent age, tattoos when visible, body build and proportions. Do not beautify, age, de-age, slim, bulk up, or redesign the face."
      : identityLock === "medium" ? "IDENTITY LOCK — MEDIUM. Preserve the person's recognizable face and major distinguishing features while allowing modest changes." : "IDENTITY LOCK — FLEXIBLE. Keep the person recognizably based on the owner reference while allowing broader art direction.";
    const heroDirection = heroPriority === "product"
      ? "HERO PRIORITY — PRODUCT. The exact product must be dominant, clearly recognizable, prominently sized and impossible to miss."
      : heroPriority === "owner" ? "HERO PRIORITY — OWNER. The owner is primary, but the exact product must remain clearly recognizable and intentional." : "HERO PRIORITY — SHARED. Owner and exact product are co-heroes; both must be immediately visible and important.";
    const interactionDirection = interaction === "Preserve original pose"
      ? "POSE LOCK. Preserve the owner's original pose and body orientation as closely as practical."
      : interaction ? `PRODUCT INTERACTION — REQUIRED: ${interaction}. This is a hard composition requirement. Make the exact interaction obvious, physically plausible and clearly visible.` : "";

    const commonPrompt = [
      "Create one cohesive, photorealistic, campaign-ready advertising scene.", identityDirection,
      "The FIRST image is the owner/person reference. Do not replace the person with a similar-looking substitute.",
      productReferenceIncluded ? "The SECOND image is the exact product reference. Preserve its recognizable form, proportions, materials and design." : `Advertising context: ${merchant} — ${product}.`,
      heroDirection, `Creative profile: ${profile.label}; mood: ${profile.mood}.`, `Ad mode: ${creativeMode}. Refinement: ${refinement}.`, formatDirection,
      "Make the result look like ONE photograph. No floating cards, split screens, picture-in-picture, inset panels, or pasted-photo layouts.",
      "Use consistent perspective, lighting, shadows, scale, depth and physical contact.",
      "Leave either the upper 30% OR lower 22% visually calm enough for external copy.",
      gaze === "Preserve original" ? "GAZE LOCK. Preserve the original eye direction." : gaze ? `Gaze: ${gaze}.` : "",
      expression === "Preserve original" ? "EXPRESSION LOCK. Preserve the original facial expression." : expression ? `Expression: ${expression}.` : "",
      interactionDirection, directions ? `Specific owner directions: ${directions}.` : "", `Visual environment direction: ${profile.backgroundDirection}.`,
      "Use premium advertising photography, believable materials, natural anatomy and realistic hands. Do not add ad copy or readable text."
    ].filter(Boolean).join("\n");

    let retryFeedback = "";
    let finalImageDataUrl = "";
    let finalValidation: ValidationResult | null = null;
    let totalImageCost = 0; let totalValidationCost = 0; let totalInputTokens = 0; let totalOutputTokens = 0; let attemptsUsed = 0;
    const sceneAttempts = identityLock === "strong" ? 2 : 2;

    for (let attempt = 1; attempt <= sceneAttempts; attempt += 1) {
      attemptsUsed += 1;
      const result = await callImageEdit({ apiKey: openAI.apiKey, model, size, quality, images: productReference ? [owner, productReference] : [owner], prompt: [commonPrompt, retryFeedback ? `QC RETRY FEEDBACK — CORRECT EVERY ITEM: ${retryFeedback}` : ""].filter(Boolean).join("\n") });
      const cost = estimateImageCost(model, result.usage, quality, size !== "1024x1024"); if (typeof cost === "number") totalImageCost += cost;
      totalInputTokens += result.usage?.input_tokens || 0; totalOutputTokens += result.usage?.output_tokens || 0;
      const checked = await validateScene({ apiKey: openAI.apiKey, validatorModel, ownerPhotoUrl, productImageUrl, generatedImageUrl: result.dataUrl, productReferenceIncluded, identityLock, heroPriority, interaction, gaze, expression });
      const validatorCost = estimateTextCostUsd(validatorModel, checked.usage); if (typeof validatorCost === "number") totalValidationCost += validatorCost;
      totalInputTokens += checked.usage?.input_tokens || 0; totalOutputTokens += checked.usage?.output_tokens || 0;
      finalImageDataUrl = result.dataUrl; finalValidation = checked.validation;
      if (checked.validation.pass) break;
      retryFeedback = checked.validation.reasons.join(" | ") || "Improve identity fidelity, product prominence and requested interaction.";
    }

    let identityRepairUsed = false;
    if (finalImageDataUrl && finalValidation && !finalValidation.pass && identityLock === "strong") {
      const failedScene = await fetchImage(finalImageDataUrl);
      const repairPrompt = [
        "IDENTITY REPAIR PASS. The FIRST image is the current campaign scene. Preserve its successful composition, product placement, environment, pose, lighting and framing as closely as possible.",
        "The SECOND image is the original owner identity reference and is the absolute source of truth for the person's face and appearance.",
        productReferenceIncluded ? "The THIRD image is the exact product reference; preserve the exact product already present in the scene." : "",
        "Repair the person so the face, head shape, baldness/hairline, eyes, eyebrows, nose, mouth, jaw, facial hair, skin tone, apparent age, tattoos when visible, body build and proportions match the SECOND image much more closely.",
        "Do NOT redesign the scene. Do NOT change the product interaction unless needed to correct anatomy. Do NOT move the product out of hero prominence.",
        finalValidation.reasons.length ? `The validator specifically found: ${finalValidation.reasons.join(" | ")}. Correct these issues.` : "",
        "Keep the result photorealistic. Do not add text, logos, captions or graphic overlays."
      ].filter(Boolean).join("\n");
      attemptsUsed += 1; identityRepairUsed = true;
      const repairImages = productReference ? [failedScene, owner, productReference] : [failedScene, owner];
      const repaired = await callImageEdit({ apiKey: openAI.apiKey, model, size, quality, images: repairImages, prompt: repairPrompt });
      const repairCost = estimateImageCost(model, repaired.usage, quality, size !== "1024x1024"); if (typeof repairCost === "number") totalImageCost += repairCost;
      totalInputTokens += repaired.usage?.input_tokens || 0; totalOutputTokens += repaired.usage?.output_tokens || 0;
      const checkedRepair = await validateScene({ apiKey: openAI.apiKey, validatorModel, ownerPhotoUrl, productImageUrl, generatedImageUrl: repaired.dataUrl, productReferenceIncluded, identityLock, heroPriority, interaction, gaze, expression });
      const repairValidationCost = estimateTextCostUsd(validatorModel, checkedRepair.usage); if (typeof repairValidationCost === "number") totalValidationCost += repairValidationCost;
      totalInputTokens += checkedRepair.usage?.input_tokens || 0; totalOutputTokens += checkedRepair.usage?.output_tokens || 0;
      finalImageDataUrl = repaired.dataUrl; finalValidation = checkedRepair.validation;
    }

    if (!finalImageDataUrl || !finalValidation) return NextResponse.json({ error: "The intelligent scene could not be produced." }, { status: 502 });
    const totalCost = totalImageCost + totalValidationCost;
    await recordOpenAIUsage({ feature: "ads", route: "/api/owner/social-ads/owner-edit", model, inputTokens: totalInputTokens, outputTokens: totalOutputTokens, estimatedCostUsd: totalCost, metadata: { merchant, product, attemptsUsed, identityRepairUsed, passedValidation: finalValidation.pass, identityLock, heroPriority, productReferenceIncluded, validation: finalValidation } });
    if (!finalValidation.pass) {
      return NextResponse.json({ error: `The AI used ${attemptsUsed} passes, including an identity-repair pass, but the result still did not meet the required quality. Nothing was accepted.`, validation: finalValidation, attemptsUsed, identityRepairUsed, estimatedCostUsd: totalCost }, { status: 422 });
    }
    return NextResponse.json({
      imageDataUrl: finalImageDataUrl, model, estimatedCostUsd: totalCost, imageGenerationCostUsd: totalImageCost, validationCostUsd: totalValidationCost,
      productReferenceIncluded, creativeProfile: profile, creativeMode, refinement, identityLock, heroPriority, attemptsUsed, identityRepairUsed,
      validation: finalValidation, recommendedCopyZone: finalValidation.recommendedCopyZone, mode: "validated-multi-pass-with-identity-repair"
    });
  } catch (error) {
    console.error("Owner image edit failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The owner photo could not be edited." }, { status: 502 });
  }
}
