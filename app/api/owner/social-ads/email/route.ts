import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringList(value: unknown, maxItems = 30, maxItemLength = 300) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxItemLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function senderAsWascikAds(alertFrom: string) {
  const match = alertFrom.match(/<([^>]+)>/);
  const address = (match?.[1] || alertFrom).trim();
  return `WASCIK Ads <${address}>`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const merchant = clean(body.merchant, 160);
  const product = clean(body.product, 300);
  const platform = clean(body.platform, 100);
  const affiliateUrl = clean(body.affiliateUrl, 2000);
  const headline = clean(body.headline, 500);
  const primaryCopy = clean(body.primaryCopy, 6000);
  const cta = clean(body.cta, 600);
  const hashtags = stringList(body.hashtags, 40, 100);
  const complianceNotes = stringList(body.complianceNotes, 30, 500);

  if (!merchant || !product || !platform || !primaryCopy) {
    return NextResponse.json({ error: "The generated ad is incomplete." }, { status: 400 });
  }

  const config = getStage6Config();
  if (!config.emailConfigured || !config.resendApiKey || !config.alertEmail || !config.alertFrom) {
    return NextResponse.json({ error: "WASCIK email delivery is not configured." }, { status: 503 });
  }

  const subject = `WASCIK Ads — ${merchant}: ${product}`;
  const text = [
    "WASCIK ADS",
    "",
    `Platform: ${platform}`,
    `Brand: ${merchant}`,
    `Product: ${product}`,
    affiliateUrl ? `Affiliate link: ${affiliateUrl}` : "",
    "",
    headline ? `HEADLINE\n${headline}` : "",
    `AD COPY\n${primaryCopy}`,
    cta ? `CTA\n${cta}` : "",
    hashtags.length ? `HASHTAGS\n${hashtags.join(" ")}` : "",
    complianceNotes.length ? `COMPLIANCE NOTES\n- ${complianceNotes.join("\n- ")}` : "",
  ].filter(Boolean).join("\n\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: senderAsWascikAds(config.alertFrom),
      to: [config.alertEmail],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("WASCIK Ads email failed", response.status, detail);
    return NextResponse.json({ error: "The ad could not be emailed right now." }, { status: 502 });
  }

  return NextResponse.json({ sent: true, message: "Ad emailed to your WASCIK alert inbox from WASCIK Ads." });
}
