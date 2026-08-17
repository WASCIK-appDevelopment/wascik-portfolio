import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";
import { unifiedAffiliateCatalog } from "../../../../../lib/ai/unifiedAffiliateCatalog";
import { proxiedAffiliateImageUrl } from "../../../../../lib/affiliateImageProxy";

const OWNER_HEADER = "x-wascik-owner-key";
const MAX_PRODUCTS = 100;
const TOKEN_TTL_MS = 5 * 60 * 1000;
const PUBLISH_PATHS = new Set([
  "/affiliate-services",
  "/affiliate-services/aquacurve",
  "/affiliate-services/eurooptic",
  "/affiliate-services/focus-camera",
  "/affiliate-services/gearup",
  "/affiliate-services/ticketnetwork",
]);

type ApprovedProduct = {
  id: string;
  merchant: string;
  title: string;
  category: string;
  description: string;
  features: string[];
  affiliateUrl: string;
  imageUrl: string | null;
  price: string | null;
  pagePath: string | null;
  source: string;
};

type Publication = { id: string; pagePath: string };
type ManagementAction = "unpublish" | "remove";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanUrl(value: unknown, max: number) {
  const text = cleanText(value, max);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function sanitizeProducts(value: unknown): ApprovedProduct[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, ApprovedProduct>();
  for (const raw of value.slice(0, MAX_PRODUCTS)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = cleanText(item.id, 240);
    const merchant = cleanText(item.merchant, 200);
    const title = cleanText(item.title, 500);
    const affiliateUrl = cleanUrl(item.affiliateUrl, 3000);
    if (!id || !merchant || !title || !affiliateUrl) continue;
    unique.set(id, {
      id,
      merchant,
      title,
      category: cleanText(item.category, 250),
      description: cleanText(item.description, 5000),
      features: (Array.isArray(item.features) ? item.features : [])
        .filter((feature): feature is string => typeof feature === "string")
        .map((feature) => feature.trim().slice(0, 500))
        .filter(Boolean)
        .slice(0, 30),
      affiliateUrl,
      imageUrl: cleanUrl(item.imageUrl, 3000) || null,
      price: cleanText(item.price, 100) || null,
      pagePath: cleanText(item.pagePath, 1000) || null,
      source: cleanText(item.source, 250),
    });
  }
  return Array.from(unique.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function sanitizePublications(value: unknown): Publication[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, Publication>();
  for (const raw of value.slice(0, MAX_PRODUCTS)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const id = cleanText(item.id, 240);
    const pagePath = cleanText(item.pagePath, 1000);
    if (id && PUBLISH_PATHS.has(pagePath)) unique.set(id, { id, pagePath });
  }
  return Array.from(unique.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function sanitizeIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.slice(0, MAX_PRODUCTS).map((id) => cleanText(id, 240)).filter(Boolean))).sort();
}

function managementPayload(action: ManagementAction, ids: string[], expiresAt: number) {
  return JSON.stringify({ action, ids, expiresAt });
}

function createManagementToken(action: ManagementAction, ids: string[]) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  if (!secret) return "";
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const signature = createHmac("sha256", secret).update(managementPayload(action, ids, expiresAt)).digest("base64url");
  return `${expiresAt}.${signature}`;
}

function managementTokenAuthorized(action: ManagementAction, ids: string[], tokenValue: unknown) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const token = cleanText(tokenValue, 500);
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(token.slice(0, dot));
  const provided = token.slice(dot + 1);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt || !provided) return false;
  const expected = createHmac("sha256", secret).update(managementPayload(action, ids, expiresAt)).digest("base64url");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function publicationPayload(publications: Publication[], expiresAt: number) {
  return JSON.stringify({ publications, expiresAt });
}

function createPublicationToken(publications: Publication[]) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  if (!secret) return "";
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const signature = createHmac("sha256", secret).update(publicationPayload(publications, expiresAt)).digest("base64url");
  return `${expiresAt}.${signature}`;
}

function publicationTokenAuthorized(publications: Publication[], tokenValue: unknown) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const token = cleanText(tokenValue, 500);
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(token.slice(0, dot));
  const provided = token.slice(dot + 1);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt || !provided) return false;
  const expected = createHmac("sha256", secret).update(publicationPayload(publications, expiresAt)).digest("base64url");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signedPayload(products: ApprovedProduct[], expiresAt: number) {
  return JSON.stringify({ products, expiresAt });
}

function createConfirmationToken(products: ApprovedProduct[]) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  if (!secret) return "";
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const signature = createHmac("sha256", secret)
    .update(signedPayload(products, expiresAt))
    .digest("base64url");
  return `${expiresAt}.${signature}`;
}

function tokenAuthorized(products: ApprovedProduct[], tokenValue: unknown) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const token = cleanText(tokenValue, 500);
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(token.slice(0, dot));
  const provided = token.slice(dot + 1);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt || !provided) return false;
  const expected = createHmac("sha256", secret)
    .update(signedPayload(products, expiresAt))
    .digest("base64url");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function supabaseHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/approved_affiliate_products?select=id,merchant,title,category,description,features,affiliate_url,image_url,price,page_path,source,approval_status,approved_at,published_at&order=approved_at.desc&limit=500`,
    { headers: supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" },
  );
  const products = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not load approved products.", detail: products }, { status: 502 });
  const suppressionResponse = await fetch(
    `${config.supabaseUrl}/rest/v1/affiliate_catalog_suppressions?select=product_id&limit=1000`,
    { headers: supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" },
  );
  const suppressionRows = suppressionResponse.ok ? await suppressionResponse.json().catch(() => []) : [];
  const suppressed = new Set(Array.isArray(suppressionRows) ? suppressionRows.map((row) => String(row.product_id || "")) : []);
  const imageOverrideResponse = await fetch(
    `${config.supabaseUrl}/rest/v1/affiliate_catalog_image_overrides?select=product_id,image_url&limit=1000`,
    { headers: supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" },
  );
  const imageOverrideRows = imageOverrideResponse.ok ? await imageOverrideResponse.json().catch(() => []) : [];
  const imageOverrides = new Map(Array.isArray(imageOverrideRows) ? imageOverrideRows.map((row) => [String(row.product_id || ""), String(row.image_url || "")]) : []);
  const builtInProducts = unifiedAffiliateCatalog
    .filter((item) => !suppressed.has(item.id))
    .map((item) => ({
      id: item.id,
      merchant: item.merchant,
      title: item.title,
      category: item.category,
      description: item.description,
      features: item.features,
      affiliate_url: item.affiliateUrl,
      image_url: proxiedAffiliateImageUrl(imageOverrides.get(item.id) || item.imageUrl || null),
      price: null,
      page_path: item.pagePath || "/affiliate-services",
      source: item.source,
      approval_status: "published",
      approved_at: null,
      published_at: "built-in",
      catalog_source: "builtin",
    }));
  const consoleProducts = Array.isArray(products) ? products.map((item) => ({ ...item, image_url: proxiedAffiliateImageUrl(item.image_url), catalog_source: "console" })) : [];
  const consoleIds = new Set(consoleProducts.map((item) => String(item.id || "")));
  return NextResponse.json({ products: [...consoleProducts, ...builtInProducts.filter((item) => !consoleIds.has(item.id))] });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (["propose_unpublish", "confirm_unpublish", "propose_remove", "confirm_remove"].includes(String(body.action))) {
    const action: ManagementAction = String(body.action).includes("remove") ? "remove" : "unpublish";
    const confirming = String(body.action).startsWith("confirm_");
    const ids = sanitizeIds(body.ids);
    if (!ids.length) return NextResponse.json({ error: "Select at least one approved product." }, { status: 400 });
    if (!confirming) {
      const confirmationToken = createManagementToken(action, ids);
      if (!confirmationToken) return NextResponse.json({ error: "Owner confirmation is not configured." }, { status: 503 });
      const verb = action === "remove" ? "Remove" : "Unpublish";
      const outcome = action === "remove" ? "It will disappear from the approved list and any public affiliate page." : "It will return to Ready to Publish and disappear from its public affiliate page.";
      return NextResponse.json({ confirmationToken, summary: `${verb} ${ids.length} approved product${ids.length === 1 ? "" : "s"}? ${outcome}` });
    }
    if (!managementTokenAuthorized(action, ids, body.confirmationToken)) return NextResponse.json({ error: "Unauthorized or unconfirmed product change." }, { status: 401 });
    const config = getStage6Config();
    if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    const changed: unknown[] = [];
    for (const id of ids) {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/approved_affiliate_products?id=eq.${encodeURIComponent(id)}&approval_status=eq.approved`, {
        method: action === "remove" ? "DELETE" : "PATCH",
        headers: { ...supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), Prefer: "return=representation" },
        ...(action === "unpublish" ? { body: JSON.stringify({ published_at: null, updated_at: new Date().toISOString() }) } : {}),
      });
      const rows = await response.json().catch(() => []);
      if (!response.ok) return NextResponse.json({ error: `Could not ${action} the approved product.`, detail: rows }, { status: 502 });
      if (Array.isArray(rows)) changed.push(...rows);
    }
    if (changed.length !== ids.length) return NextResponse.json({ error: "One or more approved products could not be found." }, { status: 409 });
    return NextResponse.json({ success: true, changedCount: changed.length, message: action === "remove" ? "Product removed from the approved list and public affiliate pages." : "Product unpublished and returned to Ready to Publish." });
  }

  if (body.action === "propose_publish" || body.action === "confirm_publish") {
    const publications = sanitizePublications(body.publications);
    if (!publications.length) return NextResponse.json({ error: "Select at least one approved product and destination." }, { status: 400 });
    if (body.action === "propose_publish") {
      const confirmationToken = createPublicationToken(publications);
      if (!confirmationToken) return NextResponse.json({ error: "Owner confirmation is not configured." }, { status: 503 });
      return NextResponse.json({ confirmationToken, count: publications.length, summary: `Publish ${publications.length} approved product${publications.length === 1 ? "" : "s"} to the selected WASCIK affiliate pages. Existing product IDs will be updated, not duplicated.` });
    }
    if (!publicationTokenAuthorized(publications, body.confirmationToken)) return NextResponse.json({ error: "Unauthorized or unconfirmed publication change." }, { status: 401 });
    const config = getStage6Config();
    if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    const now = new Date().toISOString();
    const published: unknown[] = [];
    for (const publication of publications) {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/approved_affiliate_products?id=eq.${encodeURIComponent(publication.id)}&approval_status=eq.approved`, {
        method: "PATCH",
        headers: { ...supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), Prefer: "return=representation" },
        body: JSON.stringify({ page_path: publication.pagePath, published_at: now, updated_at: now }),
      });
      const rows = await response.json().catch(() => []);
      if (!response.ok) return NextResponse.json({ error: "Could not publish the approved products.", detail: rows }, { status: 502 });
      if (Array.isArray(rows)) published.push(...rows);
    }
    if (published.length !== publications.length) return NextResponse.json({ error: "One or more approved products could not be found. Nothing new was duplicated." }, { status: 409 });
    return NextResponse.json({ success: true, publishedCount: published.length, products: published, message: "Products published to their selected development affiliate pages." });
  }

  const products = sanitizeProducts(body.products);
  if (!products.length) return NextResponse.json({ error: "Select at least one valid product." }, { status: 400 });

  if (body.action === "propose") {
    const confirmationToken = createConfirmationToken(products);
    if (!confirmationToken) return NextResponse.json({ error: "Owner confirmation is not configured." }, { status: 503 });
    return NextResponse.json({
      confirmationToken,
      count: products.length,
      summary: `Approve ${products.length} selected product${products.length === 1 ? "" : "s"} for the private affiliate catalog. Nothing will be published.`,
    });
  }

  if (body.action !== "confirm" || !tokenAuthorized(products, body.confirmationToken)) {
    return NextResponse.json({ error: "Unauthorized or unconfirmed catalog change." }, { status: 401 });
  }

  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  const now = new Date().toISOString();
  const rows = products.map((product) => ({
    id: product.id,
    merchant: product.merchant,
    title: product.title,
    category: product.category || null,
    description: product.description || null,
    features: product.features,
    affiliate_url: product.affiliateUrl,
    image_url: product.imageUrl,
    price: product.price,
    page_path: product.pagePath,
    source: product.source || null,
    approval_status: "approved",
    approved_at: now,
    published_at: null,
    updated_at: now,
  }));
  const response = await fetch(`${config.supabaseUrl}/rest/v1/approved_affiliate_products?on_conflict=id`, {
    method: "POST",
    headers: {
      ...supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  const saved = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not save the approved products.", detail: saved }, { status: 502 });
  return NextResponse.json({
    success: true,
    savedCount: Array.isArray(saved) ? saved.length : products.length,
    products: saved,
    message: "Products saved to the private approved catalog. They have not been published.",
  });
}
