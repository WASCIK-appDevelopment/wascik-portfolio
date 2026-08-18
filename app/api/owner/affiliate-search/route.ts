import { NextResponse } from "next/server";
import { AFFILIATE_BATCH_SIZE, affiliateSearchBrands, affiliateSearchCategories, affiliateSearchResultCounts, AffiliateSearchBrandId, AffiliateSearchCategoryId, isAffiliateSearchBrand, isAffiliateSearchCategory, usStateOptions } from "../../../../lib/affiliateSearch";
import { AffiliateProductCandidate, searchImpactCategory } from "../../../../lib/impactAffiliateSearch";
import { unifiedAffiliateCatalog } from "../../../../lib/ai/unifiedAffiliateCatalog";
import { proxiedAffiliateImageUrl } from "../../../../lib/affiliateImageProxy";

const OWNER_HEADER = "x-wascik-owner-key";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}


function syntacticallyUsableAffiliateUrl(value: string) {
  try {
    const url = new URL(value.trim().replaceAll("&amp;", "&"));
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) return "";
    return url.toString();
  } catch {
    return "";
  }
}

async function affiliateLinkIsUsable(value: string) {
  const url = syntacticallyUsableAffiliateUrl(value);
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1 WASCIK-Link-Check/1.0",
      },
    });
    const finalUrl = syntacticallyUsableAffiliateUrl(response.url || url);
    if (!finalUrl) return false;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return response.status !== 400 && response.status !== 404 && response.status !== 410 && response.status !== 422;
    }
    const text = (await response.text()).slice(0, 120_000);
    const explicitMalformedMessage = /(?:malformed|invalid|incorrect|bad)\s+(?:affiliate\s+|tracking\s+)?(?:link|url)|(?:link|url)\s+(?:is\s+)?(?:malformed|invalid)|unable\s+to\s+(?:process|parse).{0,40}(?:link|url)/i.test(text);
    if (explicitMalformedMessage) return false;
    return true;
  } catch {
    // A merchant blocking automated checks does not prove that its link is bad.
    // Keep it unless the URL is malformed or the destination explicitly says so.
    return true;
  }
}

function searchableText(item: (typeof unifiedAffiliateCatalog)[number]) {
  return [item.title, item.category, item.merchant, item.description, ...item.features].join(" ").toLowerCase();
}

function localCandidates(categoryId: AffiliateSearchCategoryId, excludeIds: Set<string>, brandIds: AffiliateSearchBrandId[], batchSize: number, ticketStateCode: string): AffiliateProductCandidate[] {
  const category = affiliateSearchCategories.find((entry) => entry.id === categoryId)!;
  const brands = affiliateSearchBrands.filter((brand) => brandIds.includes(brand.id));
  return unifiedAffiliateCatalog
    .filter((item) => category.keywords.some((keyword) => searchableText(item).includes(keyword)))
    .filter((item) => !brands.length || brands.some((brand) => brand.aliases.some((alias) => searchableText(item).includes(alias))))
    .filter((item) => !ticketStateCode || !searchableText(item).includes("ticketnetwork") || new RegExp(`\\b${ticketStateCode}\\b`, "i").test(searchableText(item)))
    .filter((item) => !excludeIds.has(item.id))
    .slice(0, batchSize)
    .map((item) => ({
      id: item.id,
      merchant: item.merchant,
      title: item.title,
      category: item.category,
      description: item.description,
      features: item.features,
      affiliateUrl: item.affiliateUrl,
      imageUrl: item.imageUrl || null,
      pagePath: item.pagePath || null,
      source: "WASCIK approved catalog",
    }));
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    batchSize: AFFILIATE_BATCH_SIZE,
    categories: affiliateSearchCategories.map(({ id, label }) => ({ id, label })),
    providers: {
      impact: Boolean(process.env.IMPACT_ACCOUNT_SID?.trim() && process.env.IMPACT_AUTH_TOKEN?.trim()),
      awin: Boolean(process.env.AWIN_API_TOKEN?.trim() && process.env.AWIN_PUBLISHER_ID?.trim()),
    },
    mode: "impact-live",
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { categories?: unknown; brands?: unknown; batchSize?: unknown; ticketState?: unknown; ticketStartDate?: unknown; ticketEndDate?: unknown; excludeIds?: unknown; cursors?: unknown };
  const candidates = Array.isArray(body.categories) ? body.categories : [];
  const requested: AffiliateSearchCategoryId[] = candidates
    .filter((value: unknown): value is string => typeof value === "string")
    .filter(isAffiliateSearchCategory)
    .slice(0, 10);
  if (!requested.length) return NextResponse.json({ error: "Select at least one category." }, { status: 400 });

  const requestedBrands: AffiliateSearchBrandId[] = (Array.isArray(body.brands) ? body.brands : [])
    .filter((value: unknown): value is string => typeof value === "string")
    .filter(isAffiliateSearchBrand)
    .slice(0, affiliateSearchBrands.length);

  const requestedCount = Number(body.batchSize);
  const batchSize = affiliateSearchResultCounts.some((count) => count === requestedCount) ? requestedCount : AFFILIATE_BATCH_SIZE;
  const rawState = typeof body.ticketState === "string" ? body.ticketState.trim().toUpperCase() : "";
  const state = usStateOptions.find(([code]) => code === rawState);
  const ticketStateCode = state?.[0] || "";
  const ticketStateName = state?.[1] || "";
  const ticketStartDate = typeof body.ticketStartDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.ticketStartDate) ? body.ticketStartDate : "";
  const ticketEndDate = typeof body.ticketEndDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.ticketEndDate) ? body.ticketEndDate : "";
  if (ticketStartDate && ticketEndDate && ticketStartDate > ticketEndDate) {
    return NextResponse.json({ error: "The ticket end date must be after the start date." }, { status: 400 });
  }



  // Exclude only products already shown during this signed-in console
  // session. Published catalog duplicates are checked later at publication review.
  const excludeIds = new Set(
    (Array.isArray(body.excludeIds) ? body.excludeIds : [])
      .filter((value: unknown): value is string => typeof value === "string")
      .map((value) => value.trim().slice(0, 240))
      .filter(Boolean)
      .slice(0, 5000),
  );

  const rawCursors = body.cursors && typeof body.cursors === "object" ? body.cursors as Record<string, unknown> : {};
  const cursors = Object.fromEntries(Object.entries(rawCursors)
    .filter(([key, value]) => /^[a-z0-9-]+:[a-z0-9-]+$/.test(key) && Number.isInteger(Number(value)))
    .map(([key, value]) => [key, Math.min(10000, Math.max(1, Number(value)))]));
  const nextCursors: Record<string, number> = { ...cursors };

  const impactConnected = Boolean(process.env.IMPACT_ACCOUNT_SID?.trim() && process.env.IMPACT_AUTH_TOKEN?.trim());
  const awinConnected = Boolean(process.env.AWIN_API_TOKEN?.trim() && process.env.AWIN_PUBLISHER_ID?.trim());
  let impactFailed = false;



  const searchTargets: { categoryId: AffiliateSearchCategoryId; brandId: AffiliateSearchBrandId | null }[] = [];
  for (const categoryId of requested) {
    if (requestedBrands.length) {
      for (const brandId of requestedBrands) searchTargets.push({ categoryId, brandId });
    } else {
      searchTargets.push({ categoryId, brandId: null });
    }
  }

  const requestUsedIds = new Set<string>();
  const batches: { brandId: AffiliateSearchBrandId | null; brandLabel: string | null; categoryId: AffiliateSearchCategoryId; categoryLabel: string; requestedCount: number; items: AffiliateProductCandidate[] }[] = [];
  for (const { categoryId, brandId } of searchTargets) {
    const targetKey = `${brandId || "all"}:${categoryId}`;
    const startPage = cursors[targetKey] || 1;
    let lastPageRead = startPage - 1;
    const category = affiliateSearchCategories.find((entry) => entry.id === categoryId)!;
    const brand = brandId ? affiliateSearchBrands.find((entry) => entry.id === brandId) : null;
    const targetBrands: AffiliateSearchBrandId[] = brandId ? [brandId] : [];
    let impactItems: AffiliateProductCandidate[] = [];

    if (impactConnected) {
      try {
        impactItems = await searchImpactCategory(categoryId, new Set([...excludeIds, ...requestUsedIds]), {
          brandIds: targetBrands,
          batchSize,
          ticketStateCode,
          ticketStateName,
          ticketStartDate,
          ticketEndDate,
          startPage,
          onPageRead: (page) => { lastPageRead = Math.max(lastPageRead, page); },
        });
      } catch (error) {
        impactFailed = true;
        console.error("Impact Affiliate Search failed:", error instanceof Error ? error.message : "Unknown error");
      }
    }

    const ids = new Set(impactItems.map((item) => item.id));
    // A connected search must only show affiliate-network results.
    const localItems = impactConnected ? [] : localCandidates(categoryId, new Set(), targetBrands, batchSize, ticketStateCode)
      .filter((item) => !ids.has(item.id))
      .slice(0, Math.max(0, batchSize - impactItems.length));
    const linkChecks = await Promise.all([...impactItems, ...localItems].map(async (item) => ({
      item,
      usable: await affiliateLinkIsUsable(item.affiliateUrl),
    })));
    const items = linkChecks
      .filter((result) => result.usable)
      .map((result) => result.item)
      .slice(0, batchSize)
      .map((item) => ({ ...item, sourceImageUrl: item.imageUrl || null, imageUrl: proxiedAffiliateImageUrl(item.imageUrl) }));
    items.forEach((item) => requestUsedIds.add(item.id));
    nextCursors[targetKey] = Math.max(startPage + 1, lastPageRead + 1);
    batches.push({
      brandId,
      brandLabel: brand?.label || null,
      categoryId,
      categoryLabel: category.label,
      requestedCount: batchSize,
      items,
    });
  }

  let notice = "Showing real items already approved in the WASCIK catalog.";
  const requestedTotal = searchTargets.length * batchSize;
  const returnedTotal = batches.reduce((total, batch) => total + batch.items.length, 0);
  if (impactConnected && !impactFailed) notice = returnedTotal >= requestedTotal
    ? `${returnedTotal} live Impact products are ready: ${batchSize} for each selected brand/category.`
    : `${returnedTotal} of ${requestedTotal} requested products were available. Products without a recoverable image remain visible for review instead of being discarded. Results remain separated by category.`;
  if (impactConnected && impactFailed) notice = "Impact is connected, but its product search did not respond. No products from the existing WASCIK website catalog were inserted.";
  if (!impactConnected && !awinConnected) notice = "Connect Impact or Awin server credentials to fetch new network products.";

  return NextResponse.json({
    batches,
    providers: { impact: impactConnected, awin: awinConnected },
    selectedBrands: requestedBrands.map((id) => affiliateSearchBrands.find((brand) => brand.id === id)?.label).filter(Boolean),
    notice,
    cursors: nextCursors,
    mode: impactConnected ? "impact-live" : "approved-catalog-foundation",
  });
}
