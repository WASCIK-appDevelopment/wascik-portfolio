import { NextResponse } from "next/server";
import { AFFILIATE_BATCH_SIZE, affiliateSearchBrands, affiliateSearchCategories, AffiliateSearchBrandId, AffiliateSearchCategoryId, isAffiliateSearchBrand, isAffiliateSearchCategory } from "../../../../lib/affiliateSearch";
import { AffiliateProductCandidate, searchImpactCategory } from "../../../../lib/impactAffiliateSearch";
import { unifiedAffiliateCatalog } from "../../../../lib/ai/unifiedAffiliateCatalog";

const OWNER_HEADER = "x-wascik-owner-key";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function searchableText(item: (typeof unifiedAffiliateCatalog)[number]) {
  return [item.title, item.category, item.merchant, item.description, ...item.features].join(" ").toLowerCase();
}

function localCandidates(categoryId: AffiliateSearchCategoryId, excludeIds: Set<string>, brandIds: AffiliateSearchBrandId[]): AffiliateProductCandidate[] {
  const category = affiliateSearchCategories.find((entry) => entry.id === categoryId)!;
  const brands = affiliateSearchBrands.filter((brand) => brandIds.includes(brand.id));
  return unifiedAffiliateCatalog
    .filter((item) => category.keywords.some((keyword) => searchableText(item).includes(keyword)))
    .filter((item) => !brands.length || brands.some((brand) => brand.aliases.some((alias) => searchableText(item).includes(alias))))
    .filter((item) => !excludeIds.has(item.id))
    .slice(0, AFFILIATE_BATCH_SIZE)
    .map((item) => ({
      id: item.id,
      merchant: item.merchant,
      title: item.title,
      category: item.category,
      description: item.description,
      features: item.features,
      affiliateUrl: item.affiliateUrl,
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
  const body = (await request.json().catch(() => ({}))) as { categories?: unknown; brands?: unknown; excludeIds?: unknown };
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

  const excludeIds = new Set(
    (Array.isArray(body.excludeIds) ? body.excludeIds : [])
      .filter((value: unknown): value is string => typeof value === "string")
      .map((value) => value.trim().slice(0, 200))
      .filter(Boolean)
      .slice(0, 2000),
  );

  const impactConnected = Boolean(process.env.IMPACT_ACCOUNT_SID?.trim() && process.env.IMPACT_AUTH_TOKEN?.trim());
  const awinConnected = Boolean(process.env.AWIN_API_TOKEN?.trim() && process.env.AWIN_PUBLISHER_ID?.trim());
  let impactFailed = false;

  const batches = await Promise.all(requested.map(async (categoryId) => {
    const category = affiliateSearchCategories.find((entry) => entry.id === categoryId)!;
    let impactItems: AffiliateProductCandidate[] = [];

    if (impactConnected) {
      try {
        impactItems = await searchImpactCategory(categoryId, excludeIds, requestedBrands);
      } catch (error) {
        impactFailed = true;
        console.error("Impact Affiliate Search failed:", error instanceof Error ? error.message : "Unknown error");
      }
    }

    const ids = new Set(impactItems.map((item) => item.id));
    const localItems = localCandidates(categoryId, excludeIds, requestedBrands)
      .filter((item) => !ids.has(item.id))
      .slice(0, Math.max(0, AFFILIATE_BATCH_SIZE - impactItems.length));
    const items = [...impactItems, ...localItems].slice(0, AFFILIATE_BATCH_SIZE);

    return { categoryId, categoryLabel: category.label, requestedCount: AFFILIATE_BATCH_SIZE, items };
  }));

  let notice = "Showing real items already approved in the WASCIK catalog.";
  if (impactConnected && !impactFailed) notice = "Live Impact marketplace results are ready for review.";
  if (impactConnected && impactFailed) notice = "Impact is connected, but its product search did not respond. Existing WASCIK catalog matches are shown instead.";
  if (!impactConnected && !awinConnected) notice = "Connect Impact or Awin server credentials to fetch new network products.";

  return NextResponse.json({
    batches,
    providers: { impact: impactConnected, awin: awinConnected },
    selectedBrands: requestedBrands.map((id) => affiliateSearchBrands.find((brand) => brand.id === id)?.label).filter(Boolean),
    notice,
    mode: impactConnected ? "impact-live" : "approved-catalog-foundation",
  });
}
