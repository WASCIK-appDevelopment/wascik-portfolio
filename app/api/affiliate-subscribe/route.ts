import { NextResponse } from "next/server";
import { getStage6Config } from "../../../lib/ai/stage6Config";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function supabaseHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = clean(body.email, 320).toLowerCase();
  const sourceType = clean(body.sourceType, 40) || "brand_page";
  const sourceKey = clean(body.sourceKey, 240);
  const sourceLabel = clean(body.sourceLabel, 240);
  const sourcePath = clean(body.sourcePath, 600);
  const productId = clean(body.productId, 240);
  const adPlatform = clean(body.adPlatform, 80);
  const website = clean(body.website, 200);

  if (website) return NextResponse.json({ subscribed: true });
  if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!sourceKey) return NextResponse.json({ error: "Subscription source is missing." }, { status: 400 });
  if (!["brand_page", "generated_ad", "affiliate_services"].includes(sourceType)) {
    return NextResponse.json({ error: "Invalid subscription source." }, { status: 400 });
  }

  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) {
    return NextResponse.json({ error: "Subscription service is not configured." }, { status: 503 });
  }

  const now = new Date().toISOString();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/affiliate_email_subscriptions?on_conflict=email,source_type,source_key`, {
    method: "POST",
    headers: supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind),
    body: JSON.stringify({
      email,
      source_type: sourceType,
      source_key: sourceKey,
      source_label: sourceLabel || null,
      source_path: sourcePath || null,
      product_id: productId || null,
      ad_platform: adPlatform || null,
      status: "subscribed",
      subscribed_at: now,
      unsubscribed_at: null,
      updated_at: now,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Affiliate subscription save failed", response.status, detail);
    return NextResponse.json({ error: "Your subscription could not be saved right now." }, { status: 502 });
  }

  return NextResponse.json({ subscribed: true, message: "You’re subscribed for future WASCIK Affiliate Services emails." });
}
