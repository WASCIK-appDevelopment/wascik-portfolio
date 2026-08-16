import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../../lib/ai/openaiConfig";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";

type ResponsesPayload = {
  output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
  status?: string;
  error?: { message?: string } | null;
};

type ActionProposal = {
  actionType: "change_status" | "append_note" | "set_follow_up";
  leadId: string;
  leadLabel: string;
  summary: string;
  status?: "new" | "contacted" | "in_progress" | "closed";
  note?: string;
  nextAction?: string;
  followUpAt?: string;
  confirmationToken?: string;
};

type AssistantEnvelope = { text: string; proposal?: ActionProposal | null };

type OwnerConversationTurn = { role: "owner" | "assistant"; content: string };

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

function parseEnvelope(raw: string): AssistantEnvelope {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const value = JSON.parse(cleaned) as AssistantEnvelope;
    if (value && typeof value.text === "string") return value;
  } catch {}
  return { text: raw, proposal: null };
}

function sanitizeHistory(value: unknown): OwnerConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => item as { role?: unknown; content?: unknown })
    .filter((item) => (item.role === "owner" || item.role === "assistant") && typeof item.content === "string")
    .map((item) => ({
      role: item.role as OwnerConversationTurn["role"],
      content: (item.content as string).trim().slice(0, 1200),
    }))
    .filter((item) => item.content)
    .slice(-10);
}

function validateProposal(value: unknown, leadIds: Set<string>): ActionProposal | null {
  if (!value || typeof value !== "object") return null;
  const proposal = value as Record<string, unknown>;
  const actionType = proposal.actionType;
  const leadId = typeof proposal.leadId === "string" ? proposal.leadId : "";
  const leadLabel = typeof proposal.leadLabel === "string" ? proposal.leadLabel.trim().slice(0, 160) : "Lead";
  const summary = typeof proposal.summary === "string" ? proposal.summary.trim().slice(0, 500) : "Proposed lead update";
  if (!leadIds.has(leadId)) return null;
  if (actionType !== "change_status" && actionType !== "append_note" && actionType !== "set_follow_up") return null;

  if (actionType === "change_status") {
    const status = proposal.status;
    if (status !== "new" && status !== "contacted" && status !== "in_progress" && status !== "closed") return null;
    return { actionType, leadId, leadLabel, summary, status };
  }
  if (actionType === "append_note") {
    const note = typeof proposal.note === "string" ? proposal.note.trim().slice(0, 2000) : "";
    if (!note) return null;
    return { actionType, leadId, leadLabel, summary, note };
  }
  const nextAction = typeof proposal.nextAction === "string" ? proposal.nextAction.trim().slice(0, 500) : "";
  const followUpAt = typeof proposal.followUpAt === "string" ? proposal.followUpAt.trim().slice(0, 80) : "";
  if (!nextAction && !followUpAt) return null;
  if (followUpAt && Number.isNaN(new Date(followUpAt).getTime())) return null;
  return { actionType, leadId, leadLabel, summary, ...(nextAction ? { nextAction } : {}), ...(followUpAt ? { followUpAt } : {}) };
}

function signedPayload(proposal: ActionProposal, expiresAt: number) {
  return JSON.stringify({
    actionType: proposal.actionType,
    leadId: proposal.leadId,
    status: proposal.status || "",
    note: proposal.note || "",
    nextAction: proposal.nextAction || "",
    followUpAt: proposal.followUpAt || "",
    expiresAt,
  });
}

function signProposal(proposal: ActionProposal) {
  const secret = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  if (!secret) return proposal;
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const signature = createHmac("sha256", secret).update(signedPayload(proposal, expiresAt)).digest("base64url");
  return { ...proposal, confirmationToken: `${expiresAt}.${signature}` };
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const question = typeof body.question === "string" ? body.question.trim().slice(0, 1200) : "";
  const history = sanitizeHistory(body.history);
  if (!question) return NextResponse.json({ error: "Ask a question about your leads." }, { status: 400 });

  const openAI = getOpenAIConfig();
  const stage6 = getStage6Config();
  if (!openAI.configured || !openAI.apiKey) return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  if (!stage6.databaseConfigured || !stage6.supabaseServerKey) return NextResponse.json({ error: "Lead database is not configured." }, { status: 503 });

  const select = ["id","created_at","updated_at","status","name","email","phone","business","project_type","goals","features","budget","timeline","source_path","summary","qualification_score","qualification_status","contacted_at","closed_at","owner_notes","next_action","follow_up_at"].join(",");
  const url = `${stage6.supabaseUrl}/rest/v1/leads?select=${select}&order=created_at.desc&limit=200`;
  const leadResponse = await fetch(url, { headers: supabaseHeaders(stage6.supabaseServerKey, stage6.supabaseKeyKind), cache: "no-store" });
  const leads = await leadResponse.json().catch(() => []);
  if (!leadResponse.ok || !Array.isArray(leads)) return NextResponse.json({ error: "Could not load lead data for the owner assistant." }, { status: 502 });
  const leadIds = new Set(leads.map((lead) => typeof lead?.id === "string" ? lead.id : "").filter(Boolean));

  const now = new Date().toISOString();
  const instructions = [
    "You are the private WASCIK Owner Lead Assistant.",
    "You are speaking only to the authenticated WASCIK owner inside the private console.",
    "Answer using only the supplied live lead data. Never invent facts or a lead identity.",
    "You MAY propose exactly one controlled database action, but you NEVER execute it. The interface requires owner confirmation separately.",
    "Supported proposals only: change_status, append_note, set_follow_up.",
    "For a requested status change, choose the exact matching lead and propose one of: new, contacted, in_progress, closed.",
    "For an owner note, propose append_note with only the new note text; never overwrite existing notes.",
    "For a follow-up, use set_follow_up and include nextAction and/or followUpAt. followUpAt must be an ISO date-time. If ambiguous, ask a short clarification question and return no proposal.",
    `Current server time is ${now}. Use it only to interpret explicit relative dates if unambiguous.`,
    "If multiple leads could match, do not guess. Ask which lead and return no proposal.",
    "Use the supplied OWNER CONVERSATION to understand short clarification answers such as a business name. If your immediately previous reply asked which lead, resolve the owner's answer against the live lead data and continue the original requested action.",
    "For ordinary analysis/questions, return no proposal.",
    "DEFAULT RESPONSE STYLE: short, plain-English business briefing, usually no more than about 180 words unless details are requested.",
    "Never show UUIDs/internal IDs, database field names, or technical implementation details in visible text.",
    "Identify leads by business name, person name, project type, or a short human label.",
    "When proposing a write action, visible text should briefly say what you are ready to change and that confirmation is required.",
    "OUTPUT FORMAT IS STRICT: return ONLY one valid JSON object, no markdown and no code fence.",
    "Shape: {\"text\":\"plain English response\",\"proposal\":null} for normal answers.",
    "For a write request use: {\"text\":\"...\",\"proposal\":{\"actionType\":\"change_status|append_note|set_follow_up\",\"leadId\":\"EXACT ID FROM LIVE DATA\",\"leadLabel\":\"human label\",\"summary\":\"what will change\",\"status\":\"optional\",\"note\":\"optional\",\"nextAction\":\"optional\",\"followUpAt\":\"optional ISO datetime\"}}.",
    "Do not expose passcodes, API keys, Supabase secrets, environment configuration, or internal implementation details.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openAI.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: openAI.model, instructions, input: [{ role: "user", content: `LIVE LEAD DATA:\n${JSON.stringify(leads)}\n\nOWNER CONVERSATION:\n${JSON.stringify(history)}\n\nCURRENT OWNER MESSAGE:\n${question}` }], reasoning: { effort: "minimal" }, max_output_tokens: 650, store: false }),
  });

  const data = (await response.json().catch(() => ({}))) as ResponsesPayload;
  if (!response.ok) {
    console.error("Owner lead assistant OpenAI error", response.status, data);
    return NextResponse.json({ error: "The owner assistant could not answer right now." }, { status: 502 });
  }
  const raw = extractResponseText(data);
  if (!raw) return NextResponse.json({ error: "The owner assistant returned an empty response." }, { status: 502 });
  const envelope = parseEnvelope(raw);
  const proposal = validateProposal(envelope.proposal, leadIds);
  return NextResponse.json({ text: envelope.text, proposal: proposal ? signProposal(proposal) : null, leadCount: leads.length, mode: "owner-leads-confirmed-actions" });
}
