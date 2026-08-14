import { NextResponse } from "next/server";
import { recommendAffiliateProducts } from "../../../../lib/ai/shoppingReasoner";

const disclosure = "WASCIK Affiliate Services may earn a commission if you purchase through our link, at no additional cost to you.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 500) : "";
  const merchant = typeof body.merchant === "string" ? body.merchant.trim() : undefined;

  if (!query) {
    return NextResponse.json({ error: "Tell the shopping assistant what you are looking for." }, { status: 400 });
  }

  const recommendations = recommendAffiliateProducts(query, merchant, 3);

  return NextResponse.json({
    query,
    merchant: merchant ?? "all",
    disclosure,
    recommendations,
    guidance:
      recommendations.length > 0
        ? "These options were selected from products already listed by WASCIK based on title, category, features, and description matches."
        : "No strong catalog match was found yet.",
  });
}
