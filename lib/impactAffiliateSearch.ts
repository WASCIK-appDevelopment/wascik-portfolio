import { AFFILIATE_BATCH_SIZE, affiliateSearchBrands, affiliateSearchCategories, AffiliateSearchBrandId, AffiliateSearchCategoryId } from "./affiliateSearch";

export type AffiliateProductCandidate = {
  id: string;
  merchant: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  affiliateUrl: string;
  imageUrl?: string | null;
  price?: string | null;
  pagePath?: string | null;
  source: string;
};

type ImpactRecord = Record<string, unknown>;

function textValue(record: ImpactRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function arrayValue(payload: unknown): ImpactRecord[] {
  if (Array.isArray(payload)) return payload.filter((item): item is ImpactRecord => Boolean(item) && typeof item === "object");
  if (!payload || typeof payload !== "object") return [];
  const record = payload as ImpactRecord;
  for (const key of ["Items", "CatalogItems", "Products", "Records"]) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter((item): item is ImpactRecord => Boolean(item) && typeof item === "object");
  }
  return [];
}

function normalizedId(record: ImpactRecord) {
  const raw = textValue(record, ["CatalogItemId", "ItemId", "Id", "Sku", "ProductId"])
    || textValue(record, ["TrackingLink", "Url", "ProductUrl", "Name", "Title"]);
  return raw ? `impact:${encodeURIComponent(raw).slice(0, 180)}` : "";
}

function mapImpactProduct(record: ImpactRecord, fallbackCategory: string): AffiliateProductCandidate | null {
  const id = normalizedId(record);
  const title = textValue(record, ["Name", "Title", "ProductName"]);
  if (!id || !title) return null;

  const merchant = textValue(record, ["CampaignName", "AdvertiserName", "Brand", "Manufacturer", "CatalogName"]) || "Impact merchant";
  const category = textValue(record, ["Category", "ProductCategory", "CategoryName"]) || fallbackCategory;
  const description = textValue(record, ["Description", "ShortDescription", "ProductDescription"]) || `${title} from ${merchant}.`;
  const affiliateUrl = textValue(record, ["TrackingLink", "Url", "ProductUrl", "Link", "DeepLink"]);
  const imageUrl = textValue(record, ["ImageUrl", "ImageURL", "Image", "ThumbnailUrl"]) || null;
  const price = textValue(record, ["CurrentPrice", "SalePrice", "Price"]) || null;
  const stock = textValue(record, ["StockAvailability", "Availability"]);
  const eventDate = textValue(record, ["EventDate", "StartDate", "EventStartDate", "Date"]);
  const venue = textValue(record, ["Venue", "VenueName"]);
  const location = [textValue(record, ["City", "VenueCity"]), textValue(record, ["State", "StateCode", "VenueState"])].filter(Boolean).join(", ");
  const features = [price ? `Price: ${price}` : "", stock ? `Availability: ${stock}` : "", eventDate ? `Date: ${eventDate}` : "", venue ? `Venue: ${venue}` : "", location ? `Location: ${location}` : ""].filter(Boolean);

  return {
    id,
    merchant,
    title,
    category,
    description,
    features,
    affiliateUrl,
    imageUrl,
    price,
    pagePath: null,
    source: "Impact Product Marketplace",
  };
}

async function impactRequest(keyword: string, pageSize: number) {
  const accountSid = process.env.IMPACT_ACCOUNT_SID?.trim();
  const authToken = process.env.IMPACT_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) throw new Error("Impact credentials are not configured.");

  const url = new URL(`https://api.impact.com/Mediapartners/${encodeURIComponent(accountSid)}/Catalogs/ItemSearch`);
  url.searchParams.set("Keyword", keyword);
  url.searchParams.set("Page", "1");
  url.searchParams.set("PageSize", String(Math.min(100, Math.max(pageSize, AFFILIATE_BATCH_SIZE))));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Impact returned HTTP ${response.status}.`);
  }
  return response.json() as Promise<unknown>;
}

function recordText(record: ImpactRecord) {
  return Object.values(record)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();
}

type ImpactSearchOptions = {
  brandIds?: AffiliateSearchBrandId[];
  batchSize?: number;
  ticketStateCode?: string;
  ticketStateName?: string;
  ticketStartDate?: string;
  ticketEndDate?: string;
};

function recordDate(record: ImpactRecord) {
  const raw = textValue(record, ["EventDate", "StartDate", "EventStartDate", "Date"]);
  if (!raw) return null;
  const value = Date.parse(raw);
  return Number.isNaN(value) ? null : value;
}

export async function searchImpactCategory(
  categoryId: AffiliateSearchCategoryId,
  excludeIds: Set<string>,
  options: ImpactSearchOptions = {},
) {
  const category = affiliateSearchCategories.find((entry) => entry.id === categoryId);
  if (!category) return [];

  const batchSize = Math.min(AFFILIATE_BATCH_SIZE, Math.max(5, options.batchSize || AFFILIATE_BATCH_SIZE));
  const selectedBrands = affiliateSearchBrands.filter((brand) => (options.brandIds || []).includes(brand.id));
  const queryPrefixes = selectedBrands.length ? selectedBrands.map((brand) => brand.label) : [""];
  const ticketLocation = options.ticketStateName || options.ticketStateCode || "";
  const queries = queryPrefixes.flatMap((brand) =>
    [category.label, ...category.keywords.slice(0, 3)].map((term) =>
      [brand, term, brand === "TicketNetwork" ? ticketLocation : ""].filter(Boolean).join(" "),
    ),
  );

  const results: AffiliateProductCandidate[] = [];
  const used = new Set<string>();
  const startDate = options.ticketStartDate ? Date.parse(`${options.ticketStartDate}T00:00:00`) : null;
  const endDate = options.ticketEndDate ? Date.parse(`${options.ticketEndDate}T23:59:59`) : null;

  for (const query of queries) {
    if (results.length >= batchSize) break;
    const payload = await impactRequest(query, options.ticketStateCode || startDate || endDate ? 60 : batchSize);
    for (const record of arrayValue(payload)) {
      const searchable = recordText(record);
      if (!category.keywords.some((keyword) => searchable.includes(keyword.toLowerCase()))) continue;
      if (selectedBrands.length && !selectedBrands.some((brand) => brand.aliases.some((alias) => searchable.includes(alias)))) continue;

      const isTicketNetwork = searchable.includes("ticketnetwork") || searchable.includes("ticket network");
      if (isTicketNetwork && options.ticketStateCode) {
        const code = options.ticketStateCode.toLowerCase();
        const name = (options.ticketStateName || "").toLowerCase();
        const codeMatch = new RegExp(`\\b${code}\\b`, "i").test(searchable);
        if (!codeMatch && (!name || !searchable.includes(name))) continue;
      }
      if (isTicketNetwork && (startDate || endDate)) {
        const eventDate = recordDate(record);
        if (!eventDate || (startDate && eventDate < startDate) || (endDate && eventDate > endDate)) continue;
      }

      const item = mapImpactProduct(record, category.label);
      if (!item || excludeIds.has(item.id) || used.has(item.id)) continue;
      used.add(item.id);
      results.push(item);
      if (results.length >= batchSize) break;
    }
  }

  return results;
}
