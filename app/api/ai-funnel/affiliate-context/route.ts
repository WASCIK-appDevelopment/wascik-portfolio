import { NextResponse } from "next/server";
import { getAffiliateCatalog } from "../../../../lib/ai/affiliateCatalog";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const merchant = typeof body.merchant === "string" ? body.merchant : undefined;
  const catalog = getAffiliateCatalog(merchant).slice(0, 12);

  return NextResponse.json({
    merchant: merchant ?? "all",
    disclosure: "WASCIK Affiliate Services may earn a commission if you purchase through our link, at no additional cost to you.",
    products: catalog.map((product) => ({
      id: product.id,
      merchant: product.merchant,
      title: product.title,
      category: product.category,
      description: product.description,
      features: product.features,
      affiliateUrl: product.affiliateUrl,
    })),
  });
}
