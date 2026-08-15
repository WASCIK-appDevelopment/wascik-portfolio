import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../../lib/ai/openaiConfig";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";

type ResponsesPayload = {
  output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
  status?: string;
  error?: { message?: string } | null;
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

function extractResponseText(payload: ResponsesPayload) {
  const parts = (payload.output ?? []).flatMap((item) => item.content ?? []);
  return parts.filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text?.trim()).filter(Boolean).join("\n").trim();
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 1200) : "";
  if (!question) return NextResponse.json({ error: "Ask a question about your leads." }, { status: 400 });

  const openAI = getOpenAIConfig();
  const stage6 = getStage6Config();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  if (!stage6.databaseConfigured || !stage6.supabaseServerKey) return NextResponse.json({ error: "Lead database is not configured." }, { status: 503 });

  const select = ["id","created_at","updated_at","status","name","email","phone","business","project_type","goals","features","budget","timeline","source_path","summary","qualification_score","qualification_status","contacted_at","closed_at","owner_notes","next_action","follow_up_at"].join(",");
  const url = `${stage6.supabaseUrl}/rest/v1/leads?select=${select}&order=created_at.desc&limit=200`;
  const leadResponse = await fetch(url, { headers: supabaseHeaders(stage6.supabaseServerKey, stage6.supabaseKeyKind), cache: "no-store" });
  const leads = await leadResponse.json().catch(() => []);
  if (!leadResponse.ok) return NextResponse.json({ error: "Could not load lead data for the owner assistant." }, { status: 502 });

  const instructions = [
    "You are the private WASCIK Owner Lead Assistant.",
    "You are speaking only to the authenticated WASCIK owner inside the private console.",
    "Answer using only the supplied live lead data. Never invent facts.",
    "This version is READ-ONLY. Never claim you changed, contacted, emailed, scheduled, deleted, or updated anything.",
    "DEFAULT RESPONSE STYLE: short, plain-English business briefing. Usually 3 to 6 short items and no more than about 180 words unless the owner explicitly asks for details.",
    "Never show database field names such as qualification_score, next_action, source_path, handoff_ready, created_at, or internal lead IDs unless the owner specifically asks for technical/database details.",
    "Never identify a lead by UUID/internal ID in a normal answer. Identify it by business name, person name, project type, or a short human label such as 'Landscaping website lead'.",
    "Translate statuses and database facts into natural language. Example: say 'New lead' rather than 'status = new'. Say 'Follow-up scheduled for Tuesday' rather than exposing a follow_up_at field.",
    "For priority questions, start with a one-line count such as '3 leads need attention.' Then give each lead a short label, priority level, and one-sentence reason/action.",
    "Prefer actionable wording: 'Call this lead', 'Review their request', 'Follow up today', or 'No action needed yet'.",
    "Do not dump all available lead data. Give the minimum useful answer and invite the owner to ask for details on a particular lead when appropriate.",
    "If the owner asks you to change data, say write actions are not enabled yet and briefly state the proposed change.",
    "When asked who needs attention, prioritize genuinely new/uncontacted leads, overdue follow-ups, explicit owner follow-up actions, and stronger opportunities. Do not treat a demonstration/test lead as important if the supplied data clearly identifies it as a test.",
    "Do not expose passcodes, API keys, Supabase secrets, environment configuration, or internal implementation details.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAI.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: openAI.model, instructions, input: [{ role: "user", content: `LIVE LEAD DATA:\n${JSON.stringify(leads)}\n\nOWNER QUESTION:\n${question}` }], reasoning: { effort: "minimal" }, max_output_tokens: 500, store: false }),
  });

  const data = (await response.json().catch(() => ({}))) as ResponsesPayload;
  if (!response.ok) {
    console.error("Owner lead assistant OpenAI error", response.status, data);
    return NextResponse.json({ error: "The owner assistant could not answer right now." }, { status: 502 });
  }
  const text = extractResponseText(data);
  if (!text) return NextResponse.json({ error: "The owner assistant returned an empty response." }, { status: 502 });
  return NextResponse.json({ text, leadCount: Array.isArray(leads) ? leads.length : 0, mode: "owner-leads-read-only" });
}
