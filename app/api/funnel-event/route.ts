import { NextResponse } from "next/server";
import { getStage6Config } from "../../../lib/ai/stage6Config";

const ALLOWED_EVENTS = new Set([
  "funnel_view",
  "claim_324_click",
  "ask_michael_click",
  "call_click",
  "demo_click",
  "final_cta_view",
]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const event = clean(body.event, 80);
  if (!ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const pagePath = clean(body.path, 300) || "/start-project";
  const source = clean(body.source, 120);
  const medium = clean(body.medium, 120);
  const campaign = clean(body.campaign, 160);
  const sessionId = clean(body.sessionId, 160) || null;

  const metadata = new URLSearchParams();
  metadata.set("event", event);
  if (source) metadata.set("source", source);
  if (medium) metadata.set("medium", medium);
  if (campaign) metadata.set("campaign", campaign);

  const headers: Record<string, string> = {
    apikey: config.supabaseServerKey,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  if (config.supabaseKeyKind === "service_role") {
    headers.Authorization = `Bearer ${config.supabaseServerKey}`;
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/site_visit_events`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      path: `${pagePath}#${metadata.toString()}`,
      session_id: sessionId,
      referrer: clean(request.headers.get("referer"), 1000) || null,
      user_agent: clean(request.headers.get("user-agent"), 500) || null,
    }),
  });

  return response.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ ok: false }, { status: 502 });
}
