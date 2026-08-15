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
  return parts
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
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

  const select = [
    "id","created_at","updated_at","status","name","email","phone","business","project_type","goals","features","budget","timeline","source_path","summary","qualification_score","qualification_status","contacted_at","closed_at","owner_notes","next_action","follow_up_at"
  ].join(",");
  const url = `${stage6.supabaseUrl}/rest/v1/leads?select=${select}&order=created_at.desc&limit=200`;
  const leadResponse = await fetch(url, {
    headers: supabaseHeaders(stage6.supabaseServerKey, stage6.supabaseKeyKind),
    cache: "no-store",
  });
  const leads = await leadResponse.json().catch(() => []);
  if (!leadResponse.ok) return NextResponse.json({ error: "Could not load lead data for the owner assistant." }, { status: 502 });

  const instructions = [
    "You are the private WASCIK Owner Lead Assistant.",
    "You are speaking only to the authenticated WASCIK owner inside the private console.",
    "Answer questions using only the supplied live lead data. Never invent a lead, contact detail, status, budget, follow-up, or project fact.",
    "This version is READ-ONLY. Do not claim that you changed, contacted, emailed, scheduled, deleted, or updated anything.",
    "If the owner asks you to change data, explain that write actions are not enabled yet and tell them what change you would make once enabled.",
    "Be concise but operationally useful. Prefer names/businesses and current statuses. Mention missing data when it matters.",
    "When asked who needs attention, prioritize New leads, overdue follow-ups, leads with explicit next actions, and high qualification scores, while clearly explaining the basis.",
    "Do not expose the owner passcode, API keys, Supabase secret, or other environment configuration.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAI.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: openAI.model,
      instructions,
      input: [
        { role: "user", content: `LIVE LEAD DATA:\n${JSON.stringify(leads)}\n\nOWNER QUESTION:\n${question}` },
      ],
      reasoning: { effort: "minimal" },
      max_output_tokens: 900,
      store: false,
    }),
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
