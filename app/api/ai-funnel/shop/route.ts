import { NextResponse } from "next/server";
import { resolveAssistantPageContext } from "../../../../lib/ai/pageContext";
import { recommendAffiliateProducts } from "../../../../lib/ai/shoppingReasoner";

const disclosure = "WASCIK Affiliate Services may earn a commission if you purchase through our link, at no additional cost to you.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
  const pathname = typeof body.pathname === "string" ? body.pathname.trim() : "/affiliate-services";
  const requestedMerchant = typeof body.merchant === "string" ? body.merchant.trim() : undefined;
  const pageContext = resolveAssistantPageContext(pathname);
  const merchant = pageContext.merchant ?? requestedMerchant;

  if (!query) {
    return NextResponse.json({ error: "Tell the shopping assistant what you are looking for." }, { status: 400 });
  }

  const recommendations = recommendAffiliateProducts(query, merchant, 3);

  return NextResponse.json({
    query,
    pageContext,
    merchant: merchant ?? "all",
    disclosure: pageContext.disclosureRequired ? disclosure : undefined,
    recommendations,
    guidance:
      pageContext.role === "affiliate-brand" && pageContext.merchant
        ? `Recommendations are scoped to ${pageContext.merchant} because that is the page the visitor is viewing.`
        : recommendations.length > 0
          ? "These options were selected from products already listed by WASCIK based on title, category, features, and description matches."
          : "No strong catalog match was found yet.",
  });
}
