import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";
import { retrieveWascikKnowledge } from "../../../../lib/ai/knowledgeBase";
import { ConversationTurn, LeadProfile, qualifyLead } from "../../../../lib/ai/leadQualification";
import { resolveAssistantPageContext } from "../../../../lib/ai/pageContext";
import { persistQualifiedLead } from "../../../../lib/ai/persistLead";
import { sendLeadAlert } from "../../../../lib/ai/sendLeadAlert";

type ResponsesPayload = {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string } | null;
  output?: Array<{ content?: Array<{ type?: string; text?: string; refusal?: string }> }>;
};

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as ResponsesPayload;
  const parts = (data.output ?? []).flatMap((item) => item.content ?? []);
  const text = parts.filter((item) => item.type === "output_text" && typeof item.text === "string").map((item) => item.text?.trim()).filter(Boolean).join("\n").trim();
  if (text) return text;
  return parts.filter((item) => item.type === "refusal" && typeof item.refusal === "string").map((item) => item.refusal?.trim()).filter(Boolean).join("\n").trim();
}

function sanitizeHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object").map((item) => item as { role?: unknown; content?: unknown }).filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string").map((item) => ({ role: item.role as "user" | "assistant", content: (item.content as string).trim().slice(0, 1200) })).filter((item) => item.content).slice(-10);
}

function explicitHandoffRequested(text: string) {
  return /(?:contact me|call me|email me|have (?:someone|them|wascik) (?:contact|call|email|get back to) me|send (?:this|it|my info|my information|my email|my number) (?:over|to)|pass (?:this|it|my info|my information) (?:along|on)|get back to me|follow up with me)/i.test(text);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1200) : "";
  const pathname = typeof body.pathname === "string" ? body.pathname.trim() : "/";
  const history = sanitizeHistory(body.history);
  const existingLead = body.lead && typeof body.lead === "object" ? (body.lead as LeadProfile) : {};
  const pageContext = resolveAssistantPageContext(pathname);
  if (!message) return NextResponse.json({ error: "A visitor message is required." }, { status: 400 });

  const config = getOpenAIConfig();
  if (!config.configured || !config.apiKey) return NextResponse.json({ error: "The AI service is not configured yet.", setup: "Add OPENAI_API_KEY to the server environment and restart the app." }, { status: 503 });

  const fullConversation: ConversationTurn[] = [...history, { role: "user", content: message }];
  const leadQualification = pageContext.mode === "services" ? qualifyLead(fullConversation, existingLead) : undefined;
  const hasContact = Boolean(leadQualification?.profile?.email || leadQualification?.profile?.phone);
  const hadContactBeforeThisTurn = Boolean(existingLead.email || existingLead.phone);
  const handoffRequested = explicitHandoffRequested(fullConversation.filter((turn) => turn.role === "user").map((turn) => turn.content).join("\n"));
  const knowledge = retrieveWascikKnowledge(`${message} ${history.filter((turn) => turn.role === "user").map((turn) => turn.content).join(" ")}`, pageContext.allowedTopics, 5);
  const knowledgeText = knowledge.length ? knowledge.map((fact) => `- ${fact.text}`).join("\n") : "- No additional approved WASCIK facts were retrieved for this request.";
  const leadText = leadQualification ? [
    `Lead status: ${leadQualification.status}; score: ${leadQualification.score}/100.`,
    `Known lead profile: ${JSON.stringify(leadQualification.profile)}.`,
    `Missing core qualification fields: ${leadQualification.missingFields.join(", ") || "none"}.`,
    hasContact ? "IMPORTANT: A contact method is known. The backend will capture/update this lead on this response. Do not ask permission to start an inquiry or to pass the information along; that has already happened." : "No contact method has been provided yet.",
    handoffRequested ? "The visitor explicitly requested follow-up. If contact is known, confirm the handoff and do not ask another qualification question." : "",
  ].filter(Boolean).join("\n") : "";

  const instructions = [
    "You are the WASCIK Digital Representative, a concise, helpful website representative.",
    `Current page role: ${pageContext.role}.`, `Current page path: ${pageContext.pathname}.`, pageContext.merchant ? `Current affiliate merchant: ${pageContext.merchant}.` : "",
    `Allowed topics: ${pageContext.allowedTopics.join(", ")}.`, `Preferred actions: ${pageContext.preferredActions.join(", ")}.`,
    "Use the approved knowledge below as the source of truth for WASCIK business facts. Do not invent prices, products, guarantees, policies, availability, client results, or capabilities not present in the approved knowledge or page context.",
    "APPROVED WASCIK KNOWLEDGE:", knowledgeText, leadText ? "LEAD CAPTURE STATE:" : "", leadText,
    "Remember information already provided. Never ask for a detail already present in the known profile or conversation.",
    "A usable email address or phone number is enough to capture a lead. Project type and business context are helpful enrichment, not prerequisites.",
    "Once contact information is known, never say 'would you like me to start an inquiry', 'would you like me to pass this along', or anything implying another permission step. The system is already capturing the lead.",
    "After contact is captured, acknowledge it plainly: tell the visitor that the information they have provided so far has been passed to WASCIK for follow-up. They may continue chatting if they want, but further questions are optional.",
    "If the visitor explicitly requests contact/follow-up and contact information is known, confirm the handoff and ask no more qualification questions in that reply.",
    "If the visitor is busy, leaving, or wants to stop, do not pressure them. If contact is known, confirm follow-up; otherwise ask only for one contact method.",
    "Budget and timeline are optional planning details. Never reject, suppress, downgrade, or withhold a captured lead because the stated budget appears too low for the requested scope.",
    "If a visitor's budget appears lower than the likely scope, record it accurately and keep the tone constructive. WASCIK may later discuss reduced scope, phased work, using the full available budget for a smaller first build, or financing/payment arrangements. Do not promise financing, approval, discounts, or terms that are not in approved WASCIK knowledge.",
    "Before contact capture, ask at most one light qualification question per reply and answer the visitor's immediate question first.",
    "Keep replies conversational and usually under 110 words unless the visitor asks for more detail.",
    pageContext.mode === "shopping" ? "For specific product recommendations, use only the shopping-guide flow and supplied catalog data rather than inventing a product." : "",
    pageContext.disclosureRequired ? "When discussing affiliate shopping, clearly acknowledge that WASCIK may earn a commission through affiliate links at no additional cost to the shopper." : "",
  ].filter(Boolean).join("\n");

  const input = fullConversation.map((turn) => ({ role: turn.role, content: turn.content }));
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: config.model, instructions, input, reasoning: { effort: "minimal" }, max_output_tokens: 800, store: false }) });
    const data = (await response.json().catch(() => ({}))) as ResponsesPayload;
    if (!response.ok) { console.error("OpenAI Responses API error", response.status, data); return NextResponse.json({ error: "The representative could not respond right now." }, { status: 502 }); }
    const text = extractResponseText(data);
    if (!text) return NextResponse.json({ error: data.status === "incomplete" ? "The representative ran out of response capacity. Please try again." : "The representative returned an empty response." }, { status: 502 });

    let leadPersistence: Awaited<ReturnType<typeof persistQualifiedLead>> | undefined;
    let leadAlert: Awaited<ReturnType<typeof sendLeadAlert>> | undefined;
    if (leadQualification && hasContact) {
      leadPersistence = await persistQualifiedLead({ profile: leadQualification.profile, pathname, summary: text, conversation: [...fullConversation, { role: "assistant", content: text }], qualificationScore: leadQualification.score, qualificationStatus: leadQualification.status, sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined, referrer: request.headers.get("referer") || undefined });
      // Alert only on the first turn where this session acquires contact information.
      // Later enrichment updates the same Supabase lead without flooding the owner inbox.
      if (leadPersistence.saved && !hadContactBeforeThisTurn) {
        leadAlert = await sendLeadAlert({ profile: leadQualification.profile, pathname, leadId: leadPersistence.leadId });
      }
    }

    return NextResponse.json({ text, pageContext, leadQualification, leadPersistence, leadAlert, contactCaptured: Boolean(leadPersistence?.saved), explicitHandoffRequested: handoffRequested, knowledgeIds: knowledge.map((fact) => fact.id), mode: "live-openai-stage6-contact-capture", handoffReady: leadQualification?.status === "handoff-ready" || hasContact || false });
  } catch (error) {
    console.error("WASCIK AI assistant request failed", error);
    return NextResponse.json({ error: "The representative could not respond right now." }, { status: 502 });
  }
}
