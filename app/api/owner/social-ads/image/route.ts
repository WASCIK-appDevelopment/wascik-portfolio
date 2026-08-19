import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../../lib/ai/openaiConfig";

const OWNER_HEADER = "x-wascik-owner-key";
const DEFAULT_IMAGE_MODEL = "gpt-image-1-mini";

type Quality = "low" | "medium" | "high";
type Layout = "square" | "portrait" | "story";
type Style = "clean-product" | "social" | "reel-cover" | "flyer";

type ImageApiPayload = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
};

const IMAGE_COST_USD: Record<Quality, Record<"1024x1024" | "1024x1536", number>> = {
  low: { "1024x1024": 0.005, "1024x1536": 0.006 },
  medium: { "1024x1024": 0.011, "1024x1536": 0.015 },
  high: { "1024x1024": 0.036, "1024x1536": 0.052 },
};

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function qualityValue(value: unknown): Quality {
  return value === "low" || value === "high" ? value : "medium";
}

function layoutValue(value: unknown): Layout {
  return value === "square" || value === "story" ? value : "portrait";
}

function styleValue(value: unknown): Style {
  return value === "social" || value === "reel-cover" || value === "flyer" ? value : "clean-product";
}

function backgroundSize(layout: Layout): "1024x1024" | "1024x1536" {
  return layout === "square" ? "1024x1024" : "1024x1536";
}

function styleDirection(style: Style) {
  switch (style) {
    case "social":
      return "energetic modern social-media advertising background, strong depth, bold lighting, clean negative space";
    case "reel-cover":
      return "vertical social story and reel-cover background, cinematic lighting, energetic depth, strong central visual hierarchy";
    case "flyer":
      return "polished commercial flyer background, structured visual zones, premium retail-advertising feel, clean negative space";
    default:
      return "clean premium ecommerce product-ad background, modern studio lighting, restrained commercial styling, generous negative space";
  }
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const merchant = clean(body.merchant, 140);
  const product = clean(body.product, 280);
  const category = clean(body.category, 180);
  const platform = clean(body.platform, 80);
  const headline = clean(body.headline, 260);
  const creativeNotes = clean(body.creativeNotes, 1200);
  const quality = qualityValue(body.quality);
  const layout = layoutValue(body.layout);
  const style = styleValue(body.style);

  if (!merchant || !product || !platform) {
    return NextResponse.json({ error: "Merchant, product, and platform are required." }, { status: 400 });
  }

  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
  const size = backgroundSize(layout);
  const prompt = [
    "Create ONLY the background artwork for a professional affiliate product advertisement.",
    `Brand context: ${merchant}. Product context: ${product}.`,
    category ? `Product category: ${category}.` : "",
    `Destination platform: ${platform}.`,
    `Visual direction: ${styleDirection(style)}.`,
    headline ? `Leave an uncluttered text-safe region suitable for this headline concept: ${headline}.` : "Leave clear text-safe space for a headline.",
    creativeNotes ? `Owner creative direction: ${creativeNotes}.` : "",
    "IMPORTANT: Do not render the product itself, do not invent packaging, do not render logos, people, faces, words, letters, prices, badges, watermarks, or readable text.",
    "The real product image, exact text, CTA, and optional owner portrait will be composited afterward so the product remains accurate.",
    "Make the background visually strong but leave clean foreground space for those real assets.",
  ].filter(Boolean).join("\n");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAI.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      quality,
      n: 1,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as ImageApiPayload;
  if (!response.ok) {
    console.error("Owner photo ad image error", response.status, payload);
    return NextResponse.json({ error: payload.error?.message || "The AI photo background could not be generated." }, { status: 502 });
  }

  const image = payload.data?.[0];
  if (!image?.b64_json && !image?.url) return NextResponse.json({ error: "The image model returned no image." }, { status: 502 });

  const imageDataUrl = image.b64_json ? `data:image/png;base64,${image.b64_json}` : image.url || "";
  const estimatedCostUsd = model === DEFAULT_IMAGE_MODEL ? IMAGE_COST_USD[quality][size] : null;

  return NextResponse.json({
    imageDataUrl,
    model,
    quality,
    requestedLayout: layout,
    generatedSize: size,
    estimatedCostUsd,
    mode: "ai-background-real-product-composite",
  });
}
