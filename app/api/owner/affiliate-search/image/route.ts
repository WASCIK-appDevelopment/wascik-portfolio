import { NextResponse } from "next/server";
import { safeAffiliateImageUrl, verifyAffiliateImageSignature } from "../../../../../lib/affiliateImageProxy";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const rawUrl = requestUrl.searchParams.get("url") || "";
  const providedSignature = requestUrl.searchParams.get("sig") || "";
  const imageUrl = safeAffiliateImageUrl(rawUrl);

  if (!imageUrl || !verifyAffiliateImageSignature(imageUrl.toString(), providedSignature)) {
    return NextResponse.json({ error: "Invalid image request." }, { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: `${imageUrl.protocol}//${imageUrl.host}/`,
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      },
    });

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (!response.ok || !contentType.startsWith("image/") || declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Merchant image unavailable." }, { status: 404 });
    }

    const image = await response.arrayBuffer();
    if (!image.byteLength || image.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Merchant image unavailable." }, { status: 404 });
    }

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Merchant image unavailable." }, { status: 404 });
  }
}
