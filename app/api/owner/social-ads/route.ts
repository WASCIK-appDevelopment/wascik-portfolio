import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";
import { estimateTextCostUsd, recordOpenAIUsage } from "../../../../lib/ai/openaiUsageLedger";
import { resolveCreativeProfile } from "../../../../lib/ai/socialAdCreativeProfile";

const OWNER_HEADER = "x-wascik-owner-key";
type ResponsesPayload = { output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } } };
function authorized(request: Request) { const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim(); const provided = request.headers.get(OWNER_HEADER)?.trim(); return Boolean(expected && provided && provided === expected); }
function extractResponseText(payload: ResponsesPayload) { return (payload.output ?? []).flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text?.trim()).filter(Boolean).join("\n").trim(); }

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const platform = typeof body.platform === "string" ? body.platform.trim().slice(0, 80) : "";
  const merchant = typeof body.merchant === "string" ? body.merchant.trim().slice(0, 120) : "";
  const product = typeof body.product === "string" ? body.product.trim().slice(0, 240) : "";
  const affiliateUrl = typeof body.affiliateUrl === "string" ? body.affiliateUrl.trim().slice(0, 1500) : "";
  const objective = typeof body.objective === "string" ? body.objective.trim().slice(0, 240) : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1800) : "";
  if (!platform || !merchant || !product) return NextResponse.json({ error: "Platform, merchant, and product are required." }, { status: 400 });

  const openAI = getOpenAIConfig();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  const isFirstPartyWascik = merchant.toLowerCase() === "wascik app development";
  const isFutureOffer = isFirstPartyWascik && /owner console/i.test(product);
  const creativeProfile = resolveCreativeProfile(merchant, notes, product);

  const instructions = [
    "You are the private WASCIK Social & Advertising drafting assistant.",
    isFirstPartyWascik ? "Create accurate first-party promotional copy for a WASCIK App Development service using only supplied facts." : "Create accurate affiliate promotional copy using only owner-supplied facts.",
    "Do not invent prices, discounts, specifications, availability, warranties, medical claims, customer results, personal-use claims or guarantees.",
    isFirstPartyWascik ? "This is WASCIK's own service. Do not use affiliate-disclosure or commission language." : "Preserve affiliate compliance and never claim Michael personally owns, uses, tested or recommends a product unless explicitly supplied.",
    isFutureOffer ? "The AI Owner Console is future/internal. Do not imply current public availability unless launch-ready facts are explicitly supplied." : "",
    `Creative profile: ${creativeProfile.label}. Mood: ${creativeProfile.mood}. Typography direction: ${creativeProfile.typography}.`,
    "The visual copy must feel native to that creative profile. Avoid generic, bubbly, childish or dashboard-like ad wording.",
    "Write one natural first-person SALES LINE for Michael, normally 8 to 20 seconds when spoken.",
    "For the IMAGE AD create visualHook, visualSupportLine and visualCta as a deliberate hierarchy.",
    "visualHook: 3-8 words, punchy, preferably <=45 characters. Avoid filler such as 'Discover the Future' unless specifically justified.",
    "visualSupportLine: one compact benefit or positioning thought, preferably <=75 characters.",
    "visualCta: 2-4 words, preferably <=22 characters. It must look good as a sharp campaign button or label.",
    "Do not repeat identical wording across headline, visualHook, visualSupportLine and visualCta.",
    isFirstPartyWascik ? "Use a direct WASCIK business CTA." : "Include a natural email-subscription invitation in primaryCopy in addition to the product CTA.",
    "OUTPUT STRICT JSON ONLY: {\"primaryCopy\":\"...\",\"headline\":\"...\",\"cta\":\"...\",\"salesLine\":\"...\",\"visualHook\":\"...\",\"visualSupportLine\":\"...\",\"visualCta\":\"...\",\"hashtags\":[\"...\"],\"complianceNotes\":[\"...\"]}.",
    "Keep hashtags restrained and relevant.",
  ].filter(Boolean).join("\n");

  const input = { platform, brand: merchant, productOrService: product, destinationUrl: affiliateUrl || "not supplied", offerType: isFirstPartyWascik ? (isFutureOffer ? "WASCIK first-party future offer" : "WASCIK first-party service") : "affiliate product", objective: objective || (isFirstPartyWascik ? "Drive qualified interest in the selected WASCIK service" : "Drive qualified product interest and affiliate clicks"), notes: notes || "No additional claims supplied", creativeProfile };

  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${openAI.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: openAI.model, instructions, input: [{ role: "user", content: JSON.stringify(input) }], reasoning: { effort: "minimal" }, max_output_tokens: 900, store: false }) });
  const data = (await response.json().catch(() => ({}))) as ResponsesPayload;
  if (!response.ok) { console.error("Owner social ads OpenAI error", response.status, data); return NextResponse.json({ error: "The Social & Advertising assistant could not draft content right now." }, { status: 502 }); }
  const raw = extractResponseText(data);
  if (!raw) return NextResponse.json({ error: "The drafting assistant returned an empty response." }, { status: 502 });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const cost = estimateTextCostUsd(openAI.model, data.usage);
    await recordOpenAIUsage({ feature: "ads", route: "/api/owner/social-ads", model: openAI.model, inputTokens: data.usage?.input_tokens || 0, outputTokens: data.usage?.output_tokens || 0, estimatedCostUsd: cost, metadata: { platform, merchant, product, offerType: isFirstPartyWascik ? "first-party" : "affiliate", creativeProfile: creativeProfile.key } });
    return NextResponse.json({ ...parsed, creativeProfile, offerType: isFirstPartyWascik ? "first-party" : "affiliate", apiUsage: { model: openAI.model, inputTokens: data.usage?.input_tokens || 0, outputTokens: data.usage?.output_tokens || 0, estimatedCostUsd: cost } });
  } catch { return NextResponse.json({ error: "The drafting assistant returned an invalid response." }, { status: 502 }); }
}
