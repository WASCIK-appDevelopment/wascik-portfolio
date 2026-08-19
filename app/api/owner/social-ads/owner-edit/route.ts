import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../../../lib/ai/openaiConfig";
import { recordOpenAIUsage } from "../../../../../../lib/ai/openaiUsageLedger";

const OWNER_HEADER = "x-wascik-owner-key";
const DEFAULT_MODEL = "gpt-image-1-mini";

type EditPayload = {
  data?: Array<{ b64_json?: string; url?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { image_tokens?: number; text_tokens?: number };
  };
  error?: { message?: string };
};

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeRemoteUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
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

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const ownerPhotoUrl = safeRemoteUrl(clean(body.ownerPhotoUrl, 4000));
  const productImageUrl = safeRemoteUrl(clean(body.productImageUrl, 4000));
  const merchant = clean(body.merchant, 140);
  const product = clean(body.product, 280);
  const gaze = clean(body.gaze, 100);
  const expression = clean(body.expression, 100);
  const interaction = clean(body.interaction, 160);
  const directions = clean(body.directions, 1400);
  const quality = ["low", "medium", "high"].includes(body.quality) ? body.quality : "low";
  const layout = ["square", "portrait", "story"].includes(body.layout) ? body.layout : "portrait";

  if (!ownerPhotoUrl || !merchant || !product) return NextResponse.json({ error: "Select a saved owner photo and product/service first." }, { status: 400 });

  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  const model = process.env.OPENAI_IMAGE_EDIT_MODEL?.trim() || DEFAULT_MODEL;
  const size = layout === "square" ? "1024x1024" : "1024x1536";

  try {
    const owner = await fetchImage(ownerPhotoUrl);
    const form = new FormData();
    form.append("model", model);
    form.append("size", size);
    form.append("quality", quality);
    form.append("output_format", "png");
    form.append("image[]", new Blob([owner.bytes], { type: owner.contentType }), `owner.${owner.contentType.includes("png") ? "png" : "jpg"}`);

    let productReferenceIncluded = false;
    if (productImageUrl) {
      try {
        const reference = await fetchImage(productImageUrl);
        form.append("image[]", new Blob([reference.bytes], { type: reference.contentType }), `product.${reference.contentType.includes("png") ? "png" : "jpg"}`);
        productReferenceIncluded = true;
      } catch {
        productReferenceIncluded = false;
      }
    }

    const prompt = [
      "Edit the FIRST supplied image, which is the owner/person reference. Preserve the person's recognizable facial identity, bald head, facial hair, skin tone, tattoos, body proportions, and overall likeness as closely as possible.",
      productReferenceIncluded ? "The SECOND supplied image is the exact advertised product reference. Preserve its recognizable appearance and do not replace it with an invented product." : `Advertising context: ${merchant} — ${product}. Do not invent brand logos or readable packaging text.`,
      gaze ? `Gaze / eye direction: ${gaze}.` : "",
      expression && expression !== "Preserve original" ? `Expression: ${expression}.` : "Preserve the original expression unless another instruction requires a small natural change.",
      interaction && interaction !== "Preserve original pose" ? `Product interaction / pose: ${interaction}.` : "Preserve the original pose unless directed otherwise.",
      directions ? `Specific owner directions: ${directions}.` : "",
      "Keep the result photorealistic and suitable as the person/product visual inside a professional social advertisement. Do not add ad copy, captions, prices, badges, watermarks, or extra readable text.",
    ].filter(Boolean).join("\n");
    form.append("prompt", prompt);

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openAI.apiKey}` },
      body: form,
    });
    const payload = (await response.json().catch(() => ({}))) as EditPayload;
    if (!response.ok) {
      console.error("Owner image edit error", response.status, payload);
      return NextResponse.json({ error: payload.error?.message || "The owner photo could not be edited." }, { status: 502 });
    }

    const image = payload.data?.[0];
    if (!image?.b64_json && !image?.url) return NextResponse.json({ error: "The image editor returned no image." }, { status: 502 });
    const imageDataUrl = image.b64_json ? `data:image/png;base64,${image.b64_json}` : image.url || "";
    const estimatedCostUsd = estimateCost(model, payload.usage, quality, size !== "1024x1024");

    await recordOpenAIUsage({
      feature: "ads",
      route: "/api/owner/social-ads/owner-edit",
      model,
      inputTokens: payload.usage?.input_tokens || 0,
      outputTokens: payload.usage?.output_tokens || 0,
      estimatedCostUsd,
      metadata: { merchant, product, gaze, expression, interaction, productReferenceIncluded, quality, size },
    });

    return NextResponse.json({ imageDataUrl, model, estimatedCostUsd, productReferenceIncluded, mode: "owner-photo-ai-edit" });
  } catch (error) {
    console.error("Owner image edit failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "The owner photo could not be edited." }, { status: 502 });
  }
}
