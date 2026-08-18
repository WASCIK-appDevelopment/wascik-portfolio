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

function normalizeImageUrl(value: unknown, depth = 0): string {
  if (depth > 5) return "";
  if (typeof value === "string") {
    const trimmed = value.trim().replaceAll("&amp;", "&").replaceAll("\\/", "/");
    if (trimmed.startsWith("//")) return `https:${trimmed}`;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const embeddedUrl = trimmed.match(/https?:\/\/[^"'<>\s]+/i)?.[0];
    if (embeddedUrl) return embeddedUrl;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = normalizeImageUrl(entry, depth + 1);
      if (found) return found;
    }
  }
  if (value && typeof value === "object") {
    const record = value as ImpactRecord;
    const preferredKeys = ["ImageUrl", "ImageURL", "Url", "URL", "url", "Src", "src", "Large", "Original"];
    for (const key of preferredKeys) {
      const found = normalizeImageUrl(record[key], depth + 1);
      if (found) return found;
    }
    for (const nested of Object.values(record)) {
      const found = normalizeImageUrl(nested, depth + 1);
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

function isKnownAffiliateTrackingUrl(value: string) {
  const url = safePublicUrl(decodeHtmlUrl(value));
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  return [
    "pxf.io", "sjv.io", "jdoqocy.com", "tkqlhce.com", "anrdoezrs.net",
    "dpbolvw.net", "kqzyfj.com", "evyy.net", "prf.hn",
  ].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function htmlAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return decodeHtmlUrl(match?.[1] || match?.[2] || match?.[3] || '');
}

function resolvePageAsset(value: string, pageUrl: string) {
  if (!value || value.startsWith('data:')) return '';
  const firstSrcsetValue = value.split(',')[0]?.trim().split(/\s+/)[0] || '';
  try {
    const resolved = new URL(firstSrcsetValue, pageUrl).toString();
    return safePublicUrl(resolved) ? resolved : '';
  } catch {
    return '';
  }
}

function pageImageFromHtml(html: string, pageUrl: string, productTitle: string) {
  // Merchant sites do not use one consistent attribute order, so inspect every
  // meta tag by attribute name rather than relying on a fixed regex order.
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const property = (htmlAttribute(tag, 'property') || htmlAttribute(tag, 'name') || htmlAttribute(tag, 'itemprop')).toLowerCase();
    if (!['og:image', 'og:image:url', 'og:image:secure_url', 'twitter:image', 'twitter:image:src', 'image', 'primaryimageofpage'].includes(property)) continue;
    const image = resolvePageAsset(htmlAttribute(tag, 'content'), pageUrl);
    if (image) return image;
  }

  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const rel = htmlAttribute(tag, 'rel').toLowerCase();
    if (!rel.split(/\s+/).includes('image_src') && !rel.includes('preload')) continue;
    if (rel.includes('preload') && htmlAttribute(tag, 'as').toLowerCase() !== 'image') continue;
    const image = resolvePageAsset(htmlAttribute(tag, 'href') || htmlAttribute(tag, 'imagesrcset'), pageUrl);
    if (image) return image;
  }

  // Many commerce platforms expose the authoritative product image only in
  // Product JSON-LD. Support both a string and the first entry in an array.
  const jsonLdBlocks = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  for (const block of jsonLdBlocks) {
    const imageMatch = block.match(/["']image["']\s*:\s*(?:["']([^"']+)["']|\[\s*["']([^"']+)["'])/i);
    const image = resolvePageAsset(imageMatch?.[1] || imageMatch?.[2] || '', pageUrl);
    if (image) return image;
  }

  // EuroOptic and several retail platforms embed their full-size CDN image
  // directly in page markup while the visible <img> is lazy-loaded later.
  const decodedHtml = html.replaceAll('\\/', '/').replaceAll('&amp;', '&');
  const embeddedImages = decodedHtml.match(/https?:\/\/[^"'<>\s]+\.(?:jpe?g|png|webp|avif)(?:\?[^"'<>\s]*)?/gi) || [];
  for (const candidate of embeddedImages) {
    if (/logo|icon|badge|payment|spinner/i.test(candidate)) continue;
    const image = resolvePageAsset(candidate, pageUrl);
    if (image) return image;
  }

  // Final fallback for storefronts that lazy-load the main product photo.
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  const titleTokens = productTitle.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 4);
  for (const tag of imageTags) {
    const classAndId = `${htmlAttribute(tag, 'class')} ${htmlAttribute(tag, 'id')} ${htmlAttribute(tag, 'alt')}`.toLowerCase();
    if (/logo|icon|avatar|payment|badge|spinner/.test(classAndId)) continue;
    const looksLikeProductImage = /product|gallery|main-image|featured/.test(classAndId)
      || titleTokens.some((token) => classAndId.includes(token));
    if (!looksLikeProductImage) continue;
    const source = htmlAttribute(tag, 'data-zoom-image')
      || htmlAttribute(tag, 'data-large-image')
      || htmlAttribute(tag, 'data-src')
      || htmlAttribute(tag, 'data-original')
      || htmlAttribute(tag, 'data-srcset')
      || htmlAttribute(tag, 'data-lazy-src')
      || htmlAttribute(tag, 'data-original-src')
      || htmlAttribute(tag, 'srcset')
      || htmlAttribute(tag, 'src');
    const image = resolvePageAsset(source, pageUrl);
    if (image) return image;
  }

  return '';
}

async function readerRenderedPageImage(pageUrl: string, productTitle: string) {
  try {
    const endpoint = `https://r.jina.ai/${pageUrl}`;
    const apiKey = process.env.JINA_API_KEY?.trim();
    const response = await fetch(endpoint, {
      cache: "force-cache",
      signal: AbortSignal.timeout(20000),
      headers: {
        Accept: "text/markdown,text/plain;q=0.9",
        "X-Return-Format": "markdown",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    });
    if (!response.ok) return "";
    const markdown = (await response.text()).slice(0, 2_000_000);
    const titleTokens = productTitle.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
    const candidates: { url: string; score: number }[] = [];
    const imagePattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)(?:\s+["'][^)]*["'])?\)/gi;
    for (const match of markdown.matchAll(imagePattern)) {
      const alt = (match[1] || "").toLowerCase();
      const url = decodeHtmlUrl(match[2] || "");
      if (!safePublicUrl(url) || /logo|icon|badge|avatar|payment|spinner|placeholder/i.test(`${alt} ${url}`)) continue;
      const score = titleTokens.filter((token) => alt.includes(token) || url.toLowerCase().includes(token)).length
        + (/product|gallery|main|primary|large/i.test(`${alt} ${url}`) ? 2 : 0);
      candidates.push({ url, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.url || "";
  } catch {
    return "";
  }
}

async function browserRenderedMetadataImage(pageUrl: string) {
  try {
    const endpoint = new URL("https://api.microlink.io");
    endpoint.searchParams.set("url", pageUrl);
    endpoint.searchParams.set("meta", "true");
    const response = await fetch(endpoint, {
      cache: "force-cache",
      signal: AbortSignal.timeout(20000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return "";
    const payload = await response.json().catch(() => null) as { status?: string; data?: { image?: { url?: string } | string } } | null;
    const rawImage = typeof payload?.data?.image === "string" ? payload.data.image : payload?.data?.image?.url;
    return normalizeImageUrl(rawImage);
  } catch {
    return "";
  }
}

async function resolveMerchantImage(record: ImpactRecord, affiliateUrl: string) {
  const directProductUrl = textValue(record, ['ProductUrl', 'ProductURL', 'LandingPageUrl', 'LandingPageURL', 'ProductPageUrl', 'ProductPageURL', 'ProductLink', 'ProductUri', 'Uri', 'URL', 'Url', 'Link']);
  const startingUrl = safePublicUrl(directProductUrl)?.toString() || safePublicUrl(affiliateUrl)?.toString();
  if (!startingUrl) return '';
  const productTitle = textValue(record, ['Name', 'Title', 'ProductName']);
  const renderedFallback = async (url: string) =>
    await readerRenderedPageImage(url, productTitle) || await browserRenderedMetadataImage(url);
  try {
    const response = await fetch(startingUrl, {
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
      headers: { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9', 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1 WASCIK-Affiliate-Catalog/1.1' },
    });
    if (!response.ok || !safePublicUrl(response.url)) {
      const redirectedUrl = safePublicUrl(response.url)?.toString() || startingUrl;
      return renderedFallback(redirectedUrl);
    }
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) return renderedFallback(response.url || startingUrl);
    const html = (await response.text()).slice(0, 1_500_000);
    return pageImageFromHtml(html, response.url, productTitle) || await renderedFallback(response.url || startingUrl);
  } catch {
    return renderedFallback(startingUrl);
  }
}

export async function discoverMerchantProductImage(affiliateUrl: string, productTitle: string) {
  if (!safePublicUrl(affiliateUrl)) return "";
  return resolveMerchantImage({ Name: productTitle, Url: affiliateUrl }, affiliateUrl);
}

function arrayValue(payload: unknown): ImpactRecord[] {
  if (Array.isArray(payload)) return payload.filter((item): item is ImpactRecord => Boolean(item) && typeof item === "object");
  if (!payload || typeof payload !== "object") return [];
  const record = payload as ImpactRecord;
  for (const key of ["Items", "CatalogItems", "Products", "Records", "Campaigns"]) {
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

function mapImpactProduct(record: ImpactRecord, fallbackCategory: string, campaignTrackingLinks: Map<string, string>): AffiliateProductCandidate | null {
  const id = normalizedId(record);
  const title = textValue(record, ["Name", "Title", "ProductName"]);
  if (!id || !title) return null;

  const merchant = textValue(record, ["CampaignName", "AdvertiserName", "CatalogName", "ProgramName", "PartnerName"]) || "Impact merchant";
  const category = textValue(record, ["Category", "ProductCategory", "CategoryName"]) || fallbackCategory;
  const description = textValue(record, ["Description", "ShortDescription", "ProductDescription"]) || `${title} from ${merchant}.`;
  const productUrl = textValue(record, ["Url", "URL", "ProductUrl", "ProductURL", "LandingPageUrl", "LandingPageURL"]);
  // Impact ItemSearch can return a complete, item-specific tracking URL in Url.
  // Never place that tracking URL inside a second campaign tracking wrapper.
  let affiliateUrl = isKnownAffiliateTrackingUrl(productUrl)
    ? decodeHtmlUrl(productUrl)
    : textValue(record, ["TrackingLink", "DeepLink"]);
  if (!affiliateUrl && productUrl) {
    const campaignId = textValue(record, ["CampaignId"]);
    const campaignTrackingLink = campaignTrackingLinks.get(campaignId) || "";
    if (campaignTrackingLink) {
      try {
        const trackingUrl = new URL(campaignTrackingLink);
        trackingUrl.searchParams.set("u", productUrl);
        affiliateUrl = trackingUrl.toString();
      } catch {
        affiliateUrl = "";
      }
    }
  }
  const imageUrl = imageValue(record) || null;
  const safeAffiliateUrl = safePublicUrl(decodeHtmlUrl(affiliateUrl))?.toString() || "";
  if (!safeAffiliateUrl || !commissionEligible(record)) return null;
  affiliateUrl = safeAffiliateUrl;
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

async function impactCampaignTrackingLinks() {
  const accountSid = process.env.IMPACT_ACCOUNT_SID?.trim();
  const authToken = process.env.IMPACT_AUTH_TOKEN?.trim();
  const links = new Map<string, string>();
  if (!accountSid || !authToken) return links;
  try {
    const url = new URL(`https://api.impact.com/Mediapartners/${encodeURIComponent(accountSid)}/Campaigns`);
    url.searchParams.set("PageSize", "1000");
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return links;
    for (const campaign of arrayValue(await response.json().catch(() => null))) {
      const campaignId = textValue(campaign, ["CampaignId", "Id"]);
      const trackingLink = textValue(campaign, ["TrackingLink"]);
      const contractStatus = textValue(campaign, ["ContractStatus"]).toLowerCase();
      if (campaignId && trackingLink && (!contractStatus || contractStatus === "active")) links.set(campaignId, trackingLink);
    }
  } catch {
    // The product search will return no unsafe merchant-only links if campaign
    // tracking data is temporarily unavailable.
  }
  return links;
}

function comparableProductText(value: string) {
  return value.toLowerCase().replace(/&/g, " and ").replace(/\b(the|new)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function normalizedAffiliateProductKey(merchant: string, title: string) {
  let merchantKey = comparableProductText(merchant).replaceAll(" ", "");
  if (["focuscamera", "focusbylifestyle", "lifestylebyfocus"].includes(merchantKey)) merchantKey = "focuscamera";
  return `${merchantKey}|${comparableProductText(title)}`;
}

async function impactCatalogItemImage(record: ImpactRecord) {
  const catalogId = textValue(record, ["CatalogId"]);
  const catalogItemId = textValue(record, ["CatalogItemId", "ItemId", "Id"]);
  if (!catalogId || !catalogItemId) return "";

  const accountSid = process.env.IMPACT_ACCOUNT_SID?.trim();
  const authToken = process.env.IMPACT_AUTH_TOKEN?.trim();
  if (!accountSid || !authToken) return "";

  try {
    const url = new URL(`https://api.impact.com/Mediapartners/${encodeURIComponent(accountSid)}/Catalogs/${encodeURIComponent(catalogId)}/Items`);
    url.searchParams.set("CatalogItemId", catalogItemId);
    url.searchParams.set("PageSize", "10");
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return "";
    const records = arrayValue(await response.json().catch(() => null));
    for (const catalogRecord of records) {
      const image = imageValue(catalogRecord);
      if (image) return image;
    }
  } catch {
    // Continue to merchant-page recovery when the catalog cannot supply an image.
  }
  return "";
}

export async function findImpactProductImageByTitle(title: string, merchant: string) {
  if (!title.trim()) return "";
  const titleTokens = comparableProductText(title).split(" ").filter((token) => token.length >= 3);
  const queries = [title, titleTokens.slice(0, 6).join(" ")].filter(Boolean);
  const merchantKey = comparableProductText(merchant).replaceAll(" ", "");
  for (const query of Array.from(new Set(queries))) {
    try {
      const records = arrayValue(await impactRequest(query, 100, 1));
      const ranked = records
        .map((record) => {
          const recordTitle = comparableProductText(textValue(record, ["Name", "Title", "ProductName"]));
          const recordMerchant = comparableProductText(textValue(record, ["CampaignName", "AdvertiserName", "CatalogName", "ProgramName", "PartnerName"])).replaceAll(" ", "");
          const titleScore = titleTokens.filter((token) => recordTitle.includes(token)).length;
          const merchantMatch = !merchantKey || recordMerchant.includes(merchantKey) || merchantKey.includes(recordMerchant);
          return { record, titleScore, merchantMatch };
        })
        .filter((entry) => entry.titleScore >= Math.min(2, titleTokens.length))
        .sort((a, b) => Number(b.merchantMatch) - Number(a.merchantMatch) || b.titleScore - a.titleScore);
      for (const entry of ranked) {
        const direct = imageValue(entry.record);
        if (direct) return direct;
        const catalogImage = await impactCatalogItemImage(entry.record);
        if (catalogImage) return catalogImage;
        const affiliateUrl = textValue(entry.record, ["TrackingLink", "DeepLink"]);
        const recovered = await resolveMerchantImage(entry.record, affiliateUrl);
        if (recovered) return recovered;
      }
    } catch {
      // Fall through to the merchant-link recovery already used by the caller.
    }
  }
  return "";
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
  excludeProductKeys?: Set<string>;
  startPage?: number;
  onPageRead?: (page: number) => void;
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
  const categoryTerms = [category.label, ...category.keywords];
  const brandedQueries = queryPrefixes.flatMap((brand) =>
    categoryTerms.map((term) =>
      [brand, term, brand === "TicketNetwork" ? ticketLocation : ""].filter(Boolean).join(" "),
    ),
  );
  // Impact frequently stores the advertiser only in partner metadata instead of
  // the searchable product title. Run a broader category pass too, then retain
  // only records whose partner identity matches the selected brand below.
  const categoryOnlyQueries = selectedBrands.length
    ? categoryTerms.map((term) => [term, selectedBrands.some((brand) => brand.id === "ticketnetwork") ? ticketLocation : ""].filter(Boolean).join(" "))
    : [];
  const queries = Array.from(new Set([...brandedQueries, ...categoryOnlyQueries]));

  const campaignTrackingLinks = await impactCampaignTrackingLinks();
  const results: AffiliateProductCandidate[] = [];
  const used = new Set<string>();
  let imageEnrichmentAttempts = 0;
  const startDate = options.ticketStartDate ? Date.parse(`${options.ticketStartDate}T00:00:00`) : null;
  const endDate = options.ticketEndDate ? Date.parse(`${options.ticketEndDate}T23:59:59`) : null;

  for (const query of queries) {
    if (results.length >= batchSize) break;
    const startPage = Math.max(1, Math.floor(options.startPage || 1));
    for (let page = startPage; page < startPage + 5 && results.length < batchSize; page += 1) {
      options.onPageRead?.(page);
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

        const item = mapImpactProduct(record, category.label, campaignTrackingLinks);
        if (!item || excludeIds.has(item.id) || used.has(item.id)) continue;
        if (options.excludeProductKeys?.has(normalizedAffiliateProductKey(item.merchant, item.title))) continue;
        if (!item.imageUrl && imageEnrichmentAttempts < batchSize * 4) {
          imageEnrichmentAttempts += 1;
          const catalogImage = await impactCatalogItemImage(record);
          item.imageUrl = catalogImage || null;
          if (catalogImage) item.features.push("Official image recovered from the affiliate catalog");
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
