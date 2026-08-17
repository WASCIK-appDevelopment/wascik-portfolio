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

function normalizeImageUrl(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = normalizeImageUrl(entry);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const record = value as ImpactRecord;
    for (const key of ["Url", "URL", "url", "Src", "src", "Large", "Original"]) {
      const found = normalizeImageUrl(record[key]);
      if (found) return found;
    }
  }
  return "";
}

function imageValue(record: ImpactRecord) {
  for (const key of ["ImageUrl", "ImageURL", "ImageUri", "ImageURI", "ProductImage", "PrimaryImage", "LargeImage", "ThumbnailUrl", "Thumbnail", "Image", "Images"]) {
    const found = normalizeImageUrl(record[key]);
    if (found) return found;
  }
  for (const [key, value] of Object.entries(record)) {
    if (!key.toLowerCase().includes("image")) continue;
    const found = normalizeImageUrl(value);
    if (found) return found;
  }
  return "";
}

function safePublicUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (host === 'localhost' || host.endsWith('.local') || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return null;
    const private172 = host.match(/^172\.(\d+)\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return null;
    return url;
  } catch {
    return null;
  }
}

function decodeHtmlUrl(value: string) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x2F;', '/')
    .replaceAll('\\/', '/')
    .trim();
}

function htmlAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return decodeHtmlUrl(match?.[1] || match?.[2] || match?.[3] || '');
}

function resolvePageAsset(value: string, pageUrl: string) {
  if (!value || value.startsWith('data:')) return '';
  const firstSrcsetValue = value.split(',')[0]?.trim().split(/\\s+/)[0] || '';
  try {
    const resolved = new URL(firstSrcsetValue, pageUrl).toString();
    return safePublicUrl(resolved) ? resolved : '';
  } catch {
    return '';
  }
}

function pageImageFromHtml(html: string, pageUrl: string) {
  // Merchant sites do not use one consistent attribute order, so inspect every
  // meta tag by attribute name rather than relying on a fixed regex order.
  const metaTags = html.match(/<meta\\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const property = (htmlAttribute(tag, 'property') || htmlAttribute(tag, 'name') || htmlAttribute(tag, 'itemprop')).toLowerCase();
    if (!['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src', 'image', 'primaryimageofpage'].includes(property)) continue;
    const image = resolvePageAsset(htmlAttribute(tag, 'content'), pageUrl);
    if (image) return image;
  }

  const linkTags = html.match(/<link\\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const rel = htmlAttribute(tag, 'rel').toLowerCase();
    if (!rel.split(/\\s+/).includes('image_src') && !rel.includes('preload')) continue;
    if (rel.includes('preload') && htmlAttribute(tag, 'as').toLowerCase() !== 'image') continue;
    const image = resolvePageAsset(htmlAttribute(tag, 'href') || htmlAttribute(tag, 'imagesrcset'), pageUrl);
    if (image) return image;
  }

  // Many commerce platforms expose the authoritative product image only in
  // Product JSON-LD. Support both a string and the first entry in an array.
  const jsonLdBlocks = html.match(/<script\\b[^>]*type=["']application\\/ld\\+json["'][^>]*>[\\s\\S]*?<\\/script>/gi) || [];
  for (const block of jsonLdBlocks) {
    const imageMatch = block.match(/["']image["']\\s*:\\s*(?:["']([^"']+)["']|\\[\\s*["']([^"']+)["'])/i);
    const image = resolvePageAsset(imageMatch?.[1] || imageMatch?.[2] || '', pageUrl);
    if (image) return image;
  }

  // Final fallback for storefronts that lazy-load the main product photo.
  const imageTags = html.match(/<img\\b[^>]*>/gi) || [];
  for (const tag of imageTags) {
    const classAndId = `${htmlAttribute(tag, 'class')} ${htmlAttribute(tag, 'id')} ${htmlAttribute(tag, 'alt')}`.toLowerCase();
    if (/logo|icon|avatar|payment|badge|spinner/.test(classAndId)) continue;
    const source = htmlAttribute(tag, 'data-zoom-image')
      || htmlAttribute(tag, 'data-large-image')
      || htmlAttribute(tag, 'data-src')
      || htmlAttribute(tag, 'data-original')
      || htmlAttribute(tag, 'srcset')
      || htmlAttribute(tag, 'src');
    const image = resolvePageAsset(source, pageUrl);
    if (image) return image;
  }

  return '';
}

async function resolveMerchantImage(record: ImpactRecord, affiliateUrl: string) {
  const directProductUrl = textValue(record, ['ProductUrl', 'ProductURL', 'LandingPageUrl', 'LandingPageURL', 'ProductPageUrl', 'ProductPageURL', 'ProductLink', 'ProductUri', 'Uri', 'URL', 'Url', 'Link']);
  const startingUrl = safePublicUrl(directProductUrl)?.toString() || safePublicUrl(affiliateUrl)?.toString();
  if (!startingUrl) return '';
  try {
    const response = await fetch(startingUrl, {
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
      headers: { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1 WASCIK-Affiliate-Catalog/1.1' },
    });
    if (!response.ok || !safePublicUrl(response.url)) return '';
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) return '';
    const html = (await response.text()).slice(0, 1_500_000);
    return pageImageFromHtml(html, response.url);
  } catch {
    return '';
  }
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

function partnerIdentityText(record: ImpactRecord) {
  return ["CampaignName", "AdvertiserName", "CatalogName", "ProgramName", "PartnerName"]
    .map((key) => textValue(record, [key]))
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function commissionEligible(record: ImpactRecord) {
  const relationship = textValue(record, ["PartnershipStatus", "ContractStatus", "RelationshipStatus", "CampaignStatus"]).toLowerCase();
  if (relationship && ["inactive", "expired", "declined", "rejected", "not joined", "not active", "terminated"].some((value) => relationship.includes(value))) return false;

  for (const key of ["Commission", "CommissionRate", "Payout", "PayoutRate", "SaleCommission", "DefaultCommission"]) {
    if (!(key in record)) continue;
    const value = String(record[key] ?? "").trim().toLowerCase();
    if (!value) continue;
    if (value.includes("no commission") || value === "none" || /^\$?0+(?:\.0+)?%?$/.test(value)) return false;
  }
  return true;
}

function mapImpactProduct(record: ImpactRecord, fallbackCategory: string): AffiliateProductCandidate | null {
  const id = normalizedId(record);
  const title = textValue(record, ["Name", "Title", "ProductName"]);
  if (!id || !title) return null;

  const merchant = textValue(record, ["CampaignName", "AdvertiserName", "CatalogName", "ProgramName", "PartnerName"]) || "Impact merchant";
  const category = textValue(record, ["Category", "ProductCategory", "CategoryName"]) || fallbackCategory;
  const description = textValue(record, ["Description", "ShortDescription", "ProductDescription"]) || `${title} from ${merchant}.`;
  const affiliateUrl = textValue(record, ["TrackingLink", "DeepLink"]);
  const imageUrl = imageValue(record) || null;
  if (!affiliateUrl || !commissionEligible(record)) return null;
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

async function impactRequest(keyword: string, pageSize: number, page = 1) {
  const accountSid = process.env.IMPACT_ACCOUNT_SID?.trim();
  const authToken = process.env.IMPACT_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) throw new Error("Impact credentials are not configured.");

  const url = new URL(`https://api.impact.com/Mediapartners/${encodeURIComponent(accountSid)}/Catalogs/ItemSearch`);
  url.searchParams.set("Keyword", keyword);
  url.searchParams.set("Page", String(page));
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
  let imageEnrichmentAttempts = 0;
  const startDate = options.ticketStartDate ? Date.parse(`${options.ticketStartDate}T00:00:00`) : null;
  const endDate = options.ticketEndDate ? Date.parse(`${options.ticketEndDate}T23:59:59`) : null;

  for (const query of queries) {
    if (results.length >= batchSize) break;
    for (let page = 1; page <= 3 && results.length < batchSize; page += 1) {
      const payload = await impactRequest(query, 100, page);
      const records = arrayValue(payload);
      if (!records.length) break;
      for (const record of records) {
        const searchable = recordText(record);
        const partnerIdentity = partnerIdentityText(record);
        if (!category.keywords.some((keyword) => searchable.includes(keyword.toLowerCase()))) continue;
        if (selectedBrands.length && !selectedBrands.some((brand) => brand.aliases.some((alias) => partnerIdentity.includes(alias)))) continue;

        const isTicketNetwork = partnerIdentity.includes("ticketnetwork") || partnerIdentity.includes("ticket network");
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
        if (!item.imageUrl && imageEnrichmentAttempts < batchSize * 4) {
          imageEnrichmentAttempts += 1;
          item.imageUrl = await resolveMerchantImage(record, item.affiliateUrl) || null;
          if (item.imageUrl) item.features.push('Official image recovered from the merchant product page');
        }
        // Keep valid commission-eligible products even when Impact and the merchant page do not expose an image.
        // The owner UI can show a placeholder while the image is reviewed or enriched later.
        used.add(item.id);
        results.push(item);
        if (results.length >= batchSize) break;
      }
      if (records.length < 100) break;
    }
  }

  return results;
}
