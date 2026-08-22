import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../../lib/ai/openaiConfig";
import { recordOpenAIUsage } from "../../../../../lib/ai/openaiUsageLedger";
import { resolveCreativeProfile } from "../../../../../lib/ai/socialAdCreativeProfile";

const OWNER_HEADER = "x-wascik-owner-key";
const DEFAULT_IMAGE_MODEL = "gpt-image-1-mini";

type Quality = "low" | "medium" | "high";
type Layout = "square" | "portrait" | "story";
type Style = "clean-product" | "social" | "reel-cover" | "flyer";
type CreativeMode = "product" | "composite" | "lifestyle";
type Refinement = "balanced" | "premium" | "bold" | "minimal" | "lifestyle";

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
function clean(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function qualityValue(value: unknown): Quality { return value === "low" || value === "high" ? value : "medium"; }
function layoutValue(value: unknown): Layout { return value === "square" || value === "story" ? value : "portrait"; }
function styleValue(value: unknown): Style { return value === "social" || value === "reel-cover" || value === "flyer" ? value : "clean-product"; }
function creativeModeValue(value: unknown, fallback: CreativeMode): CreativeMode { return value === "product" || value === "lifestyle" ? value : value === "composite" ? "composite" : fallback; }
function refinementValue(value: unknown): Refinement { return value === "premium" || value === "bold" || value === "minimal" || value === "lifestyle" ? value : "balanced"; }
function backgroundSize(layout: Layout): "1024x1024" | "1024x1536" { return layout === "square" ? "1024x1024" : "1024x1536"; }
function styleDirection(style: Style) {
  if (style === "social") return "energetic modern social advertising, strong depth and clean copy-safe regions";
  if (style === "reel-cover") return "vertical story/reel campaign composition, cinematic depth and strong central hierarchy";
  if (style === "flyer") return "polished campaign-flyer composition with disciplined geometry and premium negative space";
  return "premium commercial advertising with restrained composition, crisp lighting and deliberate negative space";
}
function modeDirection(mode: CreativeMode) {
  if (mode === "lifestyle") return "Design the environment as a coherent lifestyle scene that could naturally contain a person and the advertised product together. Avoid obvious empty product-card boxes or split-screen framing.";
  if (mode === "composite") return "Design a sophisticated art-directed composition with complementary zones for an exact product reference and an owner/person image, using asymmetry, depth and overlap rather than basic side-by-side boxes.";
  return "Design a strong product-led advertising environment with a single dominant product focal area and clean copy-safe space.";
}
function refinementDirection(refinement: Refinement) {
  if (refinement === "premium") return "Make it more premium: sophisticated restraint, editorial spacing, subtle depth, no cheap gradients or bubbly UI-card aesthetics.";
  if (refinement === "bold") return "Make it bolder: stronger contrast, more dramatic lighting and decisive hierarchy, while remaining commercially polished.";
  if (refinement === "minimal") return "Make it more minimal: fewer decorative elements, larger clean areas, restrained lighting and sharp hierarchy.";
  if (refinement === "lifestyle") return "Make it more lifestyle-driven: believable environment, natural light, human-scale context and aspirational realism.";
  return "Keep the visual balance polished, contemporary and commercially credible.";
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const merchant = clean(body.merchant, 140);
  const product = clean(body.product, 280);
  const category = clean(body.category, 180);
  const platform = clean(body.platform, 80);
  const headline = clean(body.headline, 260);
  const creativeNotes = clean(body.creativeNotes, 1600);
  const quality = qualityValue(body.quality);
  const layout = layoutValue(body.layout);
  const style = styleValue(body.style);
  const profile = resolveCreativeProfile(merchant, category, product);
  const creativeMode = creativeModeValue(body.creativeMode, profile.defaultMode);
  const refinement = refinementValue(body.refinement);

  if (!merchant || !product || !platform) return NextResponse.json({ error: "Merchant, product, and platform are required." }, { status: 400 });
  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });

  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
  const size = backgroundSize(layout);
  const prompt = [
    "Create ONLY the background/environment artwork for a high-quality professional advertisement.",
    `Brand: ${merchant}. Product/service: ${product}.`,
    category ? `Category: ${category}.` : "",
    `Platform: ${platform}.`,
    `Creative profile: ${profile.label}; mood: ${profile.mood}.`,
    `Brand/category art direction: ${profile.backgroundDirection}.`,
    `Ad mode: ${creativeMode}. ${modeDirection(creativeMode)}`,
    `Template direction: ${styleDirection(style)}.`,
    refinementDirection(refinement),
    headline ? `Reserve a disciplined copy-safe region for this short visual concept: ${headline}.` : "Reserve a disciplined copy-safe headline region.",
    creativeNotes ? `Owner direction: ${creativeNotes}.` : "",
    "Do not render the exact advertised product, logos, people, faces, words, letters, prices, badges, watermarks or readable text in this background.",
    "The real product/reference imagery, exact typography and CTA are added afterward. The environment must make those assets look intentionally art-directed, not pasted into generic cards.",
    "Avoid bubbly rounded-dashboard aesthetics, oversized empty panels, cartoon styling and cheap stock-template appearance.",
  ].filter(Boolean).join("\n");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAI.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
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
  await recordOpenAIUsage({ feature: "ads", route: "/api/owner/social-ads/image", model, estimatedCostUsd, metadata: { merchant, product, platform, quality, layout, size, style, creativeMode, refinement, creativeProfile: profile.key } });
  return NextResponse.json({ imageDataUrl, model, quality, requestedLayout: layout, generatedSize: size, estimatedCostUsd, creativeMode, refinement, creativeProfile: profile, mode: "brand-aware-ai-environment-real-assets-composite" });
}
