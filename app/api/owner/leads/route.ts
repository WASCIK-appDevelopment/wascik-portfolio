import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const ALLOWED_STATUSES = new Set(["new", "contacted", "in_progress", "closed"]);

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function supabaseHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const url = `${config.supabaseUrl}/rest/v1/leads?select=id,created_at,updated_at,status,name,email,phone,business,project_type,goals,features,budget,timeline,source_page,source_path,source_referrer,summary,conversation,qualification_score,qualification_status,alert_sent_at,contacted_at,closed_at&order=created_at.desc&limit=200`;
  const response = await fetch(url, { headers: supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), cache: "no-store" });
  const data = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not load leads", detail: data }, { status: 502 });
  return NextResponse.json({ leads: data });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  if (!id || !ALLOWED_STATUSES.has(status)) return NextResponse.json({ error: "Invalid lead or status" }, { status: 400 });

  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind), Prefer: "return=representation" },
    body: JSON.stringify({ status }),
  });
  const rows = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not update lead", detail: rows }, { status: 502 });
  return NextResponse.json({ lead: rows[0] ?? null });
}
