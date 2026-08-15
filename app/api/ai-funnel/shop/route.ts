import { NextResponse } from "next/server";
import { resolveAssistantPageContext } from "../../../../lib/ai/pageContext";
import { recommendAffiliateProducts } from "../../../../lib/ai/shoppingReasoner";

const disclosure = "WASCIK Affiliate Services may earn a commission if you purchase through our link, at no additional cost to you.";

const merchantDirectory = [
  { name: "TicketNetwork", aliases: ["ticketnetwork", "ticket network"], summary: "concerts, live events, and ticket listings" },
  { name: "ArcCaptain", aliases: ["arccaptain", "arc captain"], summary: "MIG, TIG, stick, and plasma welding equipment, helmets, and accessories" },
  { name: "EuroOptic", aliases: ["eurooptic", "euro optic"], summary: "optics, outdoor equipment, watches, and specialty gear" },
  { name: "Focus Camera", aliases: ["focus camera", "lifestyle by focus"], summary: "cameras, navigation, electronics, creator gear, and lifestyle products" },
  { name: "AquaCurve", aliases: ["aquacurve", "aqua curve"], summary: "poolside furniture, patio products, and outdoor living" },
  { name: "GearUP", aliases: ["gearup", "gear up"], summary: "mobile gaming connection optimization and lag reduction" },
  { name: "DHgate", aliases: ["dhgate", "dh gate"], summary: "consumer technology, creator equipment, travel tech, and accessories" },
  { name: "Philips", aliases: ["philips"], summary: "smart-home security, video doorbells, and smart locks" },
  { name: "RevoMatic", aliases: ["revomatic", "revo matic", "revomadic"], summary: "massage, recovery, skincare, beauty technology, and home fitness" },
] as const;

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function merchantFromQuery(query: string) {
  const normalized = normalize(query);
  return merchantDirectory.find((merchant) =>
    merchant.aliases.some((alias) => normalized.includes(alias))
  );
}

function asksForMerchantDirectory(query: string) {
  const normalized = normalize(query);
  return (
    normalized.includes("affiliate services") ||
    normalized.includes("all affiliates") ||
    normalized.includes("what affiliates") ||
    normalized.includes("which affiliates") ||
    normalized.includes("list affiliates") ||
    normalized.includes("affiliate brands") ||
    normalized.includes("what brands") ||
    normalized.includes("which brands") ||
    normalized.includes("what merchants") ||
    normalized.includes("which merchants")
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
  const pathname = typeof body.pathname === "string" ? body.pathname.trim() : "/affiliate-services";
  const requestedMerchant = typeof body.merchant === "string" ? body.merchant.trim() : undefined;
  const pageContext = resolveAssistantPageContext(pathname);

  if (!query) {
    return NextResponse.json({ error: "Tell the shopping assistant what you are looking for." }, { status: 400 });
  }

  const namedMerchant = merchantFromQuery(query);

  if (!namedMerchant && asksForMerchantDirectory(query)) {
    return NextResponse.json({
      query,
      pageContext,
      merchant: "all",
      disclosure,
      recommendations: [],
      guidance:
        "WASCIK currently features these approved affiliate partners: " +
        merchantDirectory.map((merchant) => `${merchant.name} (${merchant.summary})`).join("; ") +
        ". Tell me which partner or type of product interests you, and I’ll narrow it down.",
    });
  }

  const merchant = pageContext.merchant ?? namedMerchant?.name ?? requestedMerchant;
  const recommendations = recommendAffiliateProducts(query, merchant, 3);

  let guidance: string;
  if (namedMerchant) {
    guidance = recommendations.length
      ? `${namedMerchant.name} is WASCIK’s affiliate partner for ${namedMerchant.summary}. These results are limited to approved ${namedMerchant.name} listings.`
      : `${namedMerchant.name} is WASCIK’s affiliate partner for ${namedMerchant.summary}. I do not have a strong approved product match for that exact request yet, so I won’t substitute unrelated products.`;
  } else if (pageContext.role === "affiliate-brand" && pageContext.merchant) {
    guidance = recommendations.length
      ? `Recommendations are scoped to ${pageContext.merchant} because that is the page you are viewing.`
      : `I do not have a strong approved ${pageContext.merchant} match for that request yet, so I won’t show unrelated products.`;
  } else {
    guidance = recommendations.length
      ? "These options were selected only from products already approved and listed by WASCIK."
      : "No strong approved catalog match was found. Try naming a merchant, product type, or intended use.";
  }

  return NextResponse.json({
    query,
    pageContext,
    merchant: merchant ?? "all",
    disclosure: pageContext.disclosureRequired ? disclosure : undefined,
    recommendations,
    guidance,
  });
}
