import { NextResponse } from "next/server";

const PRODUCT_PAGE = "https://revomadic.com/products/revo-therapy-massage-oil";

export async function GET() {
  try {
    const pageResponse = await fetch(PRODUCT_PAGE, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
    });

    if (!pageResponse.ok) {
      return new NextResponse("Product image unavailable", { status: 502 });
    }

    const html = await pageResponse.text();
    const match = html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i);

    if (!match?.[1]) {
      return new NextResponse("Product image not found", { status: 404 });
    }

    const imageUrl = match[1].replace(/&amp;/g, "&");
    const imageResponse = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0", Referer: PRODUCT_PAGE },
      next: { revalidate: 86400 },
    });

    if (!imageResponse.ok) {
      return new NextResponse("Product image unavailable", { status: 502 });
    }

    return new NextResponse(await imageResponse.arrayBuffer(), {
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return new NextResponse("Product image unavailable", { status: 502 });
  }
}
