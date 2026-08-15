import { NextResponse } from "next/server";
import { getStage6Config } from "../../../lib/ai/stage6Config";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function supabaseHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const destinationUrl = clean(body.destinationUrl, 2000);
  const merchant = clean(body.merchant, 160);
  const itemLabel = clean(body.itemLabel, 300);
  const sourcePath = clean(body.sourcePath, 500) || "/";
  const sessionId = clean(body.sessionId, 160);

  let parsed: URL;
  try {
    parsed = new URL(destinationUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("unsupported protocol");
  } catch {
    return NextResponse.json({ error: "Invalid destination URL" }, { status: 400 });
  }

  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) {
    return NextResponse.json({ recorded: false, reason: "database_not_configured" }, { status: 200 });
  }

  const record = {
    session_id: sessionId || null,
    merchant: merchant || parsed.hostname,
    item_label: itemLabel || null,
    source_path: sourcePath,
    destination_url: destinationUrl,
    destination_host: parsed.hostname,
    referrer: request.headers.get("referer")?.slice(0, 1000) || null,
    user_agent: request.headers.get("user-agent")?.slice(0, 1000) || null,
  };

  const response = await fetch(`${config.supabaseUrl}/rest/v1/affiliate_click_events`, {
    method: "POST",
    headers: { ...supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), Prefer: "return=minimal" },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Affiliate click tracking failed", response.status, detail);
    return NextResponse.json({ recorded: false, reason: "database_insert_failed" }, { status: 200 });
  }

  return NextResponse.json({ recorded: true });
}
