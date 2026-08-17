import { NextResponse } from "next/server";
import { discoverMerchantProductImage, findImpactProductImageByTitle } from "../../../../../lib/impactAffiliateSearch";
import { proxiedAffiliateImageUrl } from "../../../../../lib/affiliateImageProxy";

const OWNER_HEADER = "x-wascik-owner-key";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({})) as {
    title?: unknown;
    merchant?: unknown;
    affiliateUrl?: unknown;
  };
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 300) : "";
  const merchant = typeof body.merchant === "string" ? body.merchant.trim().slice(0, 160) : "";
  const affiliateUrl = typeof body.affiliateUrl === "string" ? body.affiliateUrl.trim().slice(0, 3000) : "";
  if (!title || !affiliateUrl) {
    return NextResponse.json({ error: "The product title and affiliate link are required." }, { status: 400 });
  }

  const imageUrl = await findImpactProductImageByTitle(title, merchant)
    || await discoverMerchantProductImage(affiliateUrl, title);

  if (!imageUrl) {
    return NextResponse.json({
      error: "No usable product picture was returned. Open the affiliate link to confirm the merchant page.",
    }, { status: 404 });
  }

  return NextResponse.json({
    imageUrl: proxiedAffiliateImageUrl(imageUrl),
    sourceImageUrl: imageUrl,
    message: `Thumbnail recovered for ${title}.`,
  });
}
