import { NextResponse } from "next/server";
import { AFFILIATE_BATCH_SIZE, affiliateSearchCategories, AffiliateSearchCategoryId, isAffiliateSearchCategory } from "../../../../lib/affiliateSearch";
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

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    batchSize: AFFILIATE_BATCH_SIZE,
    categories: affiliateSearchCategories.map(({ id, label }) => ({ id, label })),
    providers: {
      impact: Boolean(process.env.IMPACT_ACCOUNT_SID?.trim() && process.env.IMPACT_AUTH_TOKEN?.trim()),
      awin: Boolean(process.env.AWIN_API_TOKEN?.trim() && process.env.AWIN_PUBLISHER_ID?.trim()),
    },
    mode: "approved-catalog-foundation",
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { categories?: unknown };
  const candidates = Array.isArray(body.categories) ? body.categories : [];
  const requested: AffiliateSearchCategoryId[] = candidates
    .filter((value: unknown): value is string => typeof value === "string")
    .filter(isAffiliateSearchCategory)
    .slice(0, 10);
  if (!requested.length) return NextResponse.json({ error: "Select at least one category." }, { status: 400 });

  const batches = requested.map((categoryId) => {
    const category = affiliateSearchCategories.find((entry) => entry.id === categoryId)!;
    const items = unifiedAffiliateCatalog
      .filter((item) => category.keywords.some((keyword) => searchableText(item).includes(keyword)))
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
    return { categoryId, categoryLabel: category.label, requestedCount: AFFILIATE_BATCH_SIZE, items };
  });

  const impactConnected = Boolean(process.env.IMPACT_ACCOUNT_SID?.trim() && process.env.IMPACT_AUTH_TOKEN?.trim());
  const awinConnected = Boolean(process.env.AWIN_API_TOKEN?.trim() && process.env.AWIN_PUBLISHER_ID?.trim());
  return NextResponse.json({
    batches,
    providers: { impact: impactConnected, awin: awinConnected },
    notice: impactConnected || awinConnected
      ? "Approved-network connection detected. Live feed adapters are the next implementation step."
      : "Showing real items already approved in the WASCIK catalog. Connect Impact and/or Awin server credentials to fetch new 20-product network batches.",
    mode: "approved-catalog-foundation",
  });
}
