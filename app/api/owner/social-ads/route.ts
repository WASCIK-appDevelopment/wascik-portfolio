import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";
import { estimateTextCostUsd, recordOpenAIUsage } from "../../../../lib/ai/openaiUsageLedger";

const OWNER_HEADER = "x-wascik-owner-key";

type ResponsesPayload = {
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: { cached_tokens?: number };
  };
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

  const isFirstPartyWascik = merchant.toLowerCase() === "wascik app development";
  const isFutureOffer = isFirstPartyWascik && /owner console/i.test(product);

  const instructions = [
    "You are the private WASCIK Social & Advertising drafting assistant.",
    isFirstPartyWascik
      ? "Create accurate first-party promotional copy for a WASCIK App Development service using only the supplied facts. This is WASCIK's own service, not an affiliate product."
      : "Create accurate affiliate promotional copy using only the owner-supplied facts.",
    "Do not invent prices, discounts, specifications, availability, warranties, medical claims, customer results, or personal use claims.",
    isFirstPartyWascik
      ? "Do not use affiliate-disclosure language, commission language, or call the destination an affiliate link. Direct people to WASCIK itself for the service."
      : "Never say WASCIK personally uses or endorses a product unless the owner explicitly supplied that fact.",
    !isFirstPartyWascik ? "Preserve affiliate compliance: make the commercial relationship clear and do not disguise the destination or tracking link." : "",
    isFutureOffer ? "The AI Owner Console is a future/internal WASCIK offer. Do not state or imply that it is currently available for purchase, subscription, or public signup unless the owner explicitly supplied launch-ready facts in the notes." : "",
    "If the notes contain uncertain claims, omit them rather than strengthening them.",
    "Return concise content suitable for the named platform.",
    isFirstPartyWascik
      ? "For first-party WASCIK service ads, use a direct business CTA such as visiting WASCIK, learning more, requesting information, or starting a project when supported by the supplied facts."
      : "EVERY generated affiliate ad must include a clear final invitation to subscribe for future WASCIK Affiliate Services email deals, product updates, and recommendations. Do not imply the person is subscribed until they actively submit their email.",
    !isFirstPartyWascik ? "The subscription invitation should fit naturally into primaryCopy and should direct interested people to subscribe through WASCIK Affiliate Services or the relevant WASCIK affiliate brand page." : "",
    "Also write one short first-person SALES LINE for Michael to read aloud in his own voice. It should sound natural when spoken, promote the selected product or service without exaggeration, and normally fit in about 8 to 20 seconds.",
    !isFirstPartyWascik ? "Do not claim Michael personally owns, uses, tested, or recommends the product unless that fact was explicitly supplied." : "For a WASCIK first-party service, Michael may speak as the business owner using 'we' or 'WASCIK' but do not invent personal achievements, client results, or guarantees.",
    "For the IMAGE AD specifically, create three separate visual fields: visualHook, visualSupportLine, and visualCta.",
    "visualHook must be punchy and short enough for a graphic headline, normally 3 to 8 words and never more than 55 characters.",
    "visualSupportLine must add one useful benefit or positioning idea in one compact line, normally 5 to 14 words and never more than 90 characters.",
    "visualCta must be a short button label, normally 2 to 5 words and never more than 28 characters. Do not put a sentence in the visual CTA button.",
    "Do not merely repeat the same wording in headline, visualHook, visualSupportLine, and visualCta. Make the visual fields work together as an actual ad hierarchy.",
    "OUTPUT FORMAT IS STRICT JSON ONLY with this shape: {\"primaryCopy\":\"...\",\"headline\":\"...\",\"cta\":\"...\",\"salesLine\":\"...\",\"visualHook\":\"...\",\"visualSupportLine\":\"...\",\"visualCta\":\"...\",\"hashtags\":[\"...\"],\"complianceNotes\":[\"...\"]}.",
    isFirstPartyWascik
      ? "The CTA should promote the WASCIK service directly and should not mention affiliate links."
      : "The CTA should normally direct people to the supplied affiliate link or to the link in bio when that fits the platform; the email-subscription invitation is an additional opt-in invitation, not a replacement for the product CTA.",
    "Keep hashtags relevant and restrained. Avoid spammy tag stuffing.",
  ].filter(Boolean).join("\n");

  const input = {
    platform,
    brand: merchant,
    productOrService: product,
    destinationUrl: affiliateUrl || "not supplied",
    offerType: isFirstPartyWascik ? (isFutureOffer ? "WASCIK first-party future offer" : "WASCIK first-party service") : "affiliate product",
    objective: objective || (isFirstPartyWascik ? "Drive qualified interest in the selected WASCIK service" : "Drive qualified product interest and affiliate clicks"),
    notes: notes || "No additional claims supplied",
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
      max_output_tokens: 900,
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
    const cost = estimateTextCostUsd(openAI.model, data.usage);
    await recordOpenAIUsage({
      feature: "ads",
      route: "/api/owner/social-ads",
      model: openAI.model,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      estimatedCostUsd: cost,
      metadata: { platform, merchant, product, offerType: isFirstPartyWascik ? "first-party" : "affiliate" },
    });
    return NextResponse.json({
      ...parsed,
      offerType: isFirstPartyWascik ? "first-party" : "affiliate",
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
