import { NextResponse } from "next/server";
import { getStage6Config } from "../../../lib/ai/stage6Config";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ ok: false }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const path = clean(body.path, 500) || "/";
  const sessionId = clean(body.sessionId, 160) || null;
  const headers: Record<string, string> = { apikey: config.supabaseServerKey, "Content-Type": "application/json", Prefer: "return=minimal" };
  if (config.supabaseKeyKind === "service_role") headers.Authorization = `Bearer ${config.supabaseServerKey}`;

  const response = await fetch(`${config.supabaseUrl}/rest/v1/site_visit_events`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      path,
      session_id: sessionId,
      referrer: clean(request.headers.get("referer"), 1000) || null,
      user_agent: clean(request.headers.get("user-agent"), 500) || null,
    }),
  });

  return response.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false }, { status: 502 });
}
