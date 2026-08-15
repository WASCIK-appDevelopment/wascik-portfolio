import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const ALLOWED_STATUSES = new Set(["new", "contacted", "in_progress", "closed"]);

type LeadRow = {
  id: string;
  status?: string | null;
  owner_notes?: string | null;
  next_action?: string | null;
  follow_up_at?: string | null;
};

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

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const leadId = cleanText(body.leadId, 80);
  const actionType = cleanText(body.actionType, 40);
  if (!leadId || !actionType) return NextResponse.json({ error: "Missing lead or action." }, { status: 400 });

  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const baseHeaders = supabaseHeaders(config.supabaseServerKey, config.supabaseKeyKind);
  const readResponse = await fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(leadId)}&select=id,status,owner_notes,next_action,follow_up_at&limit=1`, { headers: baseHeaders, cache: "no-store" });
  const rows = (await readResponse.json().catch(() => [])) as LeadRow[];
  if (!readResponse.ok || !rows[0]) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  const current = rows[0];

  const patch: Record<string, unknown> = {};
  let description = "";

  if (actionType === "change_status") {
    const status = cleanText(body.status, 30);
    if (!ALLOWED_STATUSES.has(status)) return NextResponse.json({ error: "Invalid lead status." }, { status: 400 });
    patch.status = status;
    description = `Status changed to ${status.replace("_", " ")}.`;
  } else if (actionType === "append_note") {
    const note = cleanText(body.note, 2000);
    if (!note) return NextResponse.json({ error: "A note is required." }, { status: 400 });
    const existing = cleanText(current.owner_notes, 8000);
    patch.owner_notes = existing ? `${existing}\n\n${note}`.slice(0, 10000) : note;
    description = "Owner note added.";
  } else if (actionType === "set_follow_up") {
    const nextAction = cleanText(body.nextAction, 500);
    const followUpAt = cleanText(body.followUpAt, 80);
    if (!nextAction && !followUpAt) return NextResponse.json({ error: "A next action or follow-up time is required." }, { status: 400 });
    if (nextAction) patch.next_action = nextAction;
    if (followUpAt) {
      const date = new Date(followUpAt);
      if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Invalid follow-up date/time." }, { status: 400 });
      patch.follow_up_at = date.toISOString();
    }
    description = "Follow-up updated.";
  } else {
    return NextResponse.json({ error: "Unsupported owner AI action." }, { status: 400 });
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(leadId)}`, {
    method: "PATCH",
    headers: { ...baseHeaders, Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  const updated = await response.json().catch(() => []);
  if (!response.ok) return NextResponse.json({ error: "Could not apply the confirmed change.", detail: updated }, { status: 502 });

  return NextResponse.json({ success: true, description, lead: updated[0] ?? null });
}
