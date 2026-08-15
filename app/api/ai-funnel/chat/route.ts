import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";
import { retrieveWascikKnowledge } from "../../../../lib/ai/knowledgeBase";
import { ConversationTurn, LeadProfile, qualifyLead } from "../../../../lib/ai/leadQualification";
import { resolveAssistantPageContext } from "../../../../lib/ai/pageContext";
import { persistQualifiedLead } from "../../../../lib/ai/persistLead";

type ResponsesPayload = {
  status?: string;
  incomplete_details?: { reason?: string } | null;
  error?: { message?: string } | null;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
};

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as ResponsesPayload;
  const parts = (data.output ?? []).flatMap((item) => item.content ?? []);
  const text = parts
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  if (text) return text;
  return parts
    .filter((item) => item.type === "refusal" && typeof item.refusal === "string")
    .map((item) => item.refusal?.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function sanitizeHistory(value: unknown): ConversationTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => item as { role?: unknown; content?: unknown })
    .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .map((item) => ({ role: item.role as "user" | "assistant", content: (item.content as string).trim().slice(0, 1200) }))
    .filter((item) => item.content)
    .slice(-10);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1200) : "";
  const pathname = typeof body.pathname === "string" ? body.pathname.trim() : "/";
  const history = sanitizeHistory(body.history);
  const existingLead = body.lead && typeof body.lead === "object" ? (body.lead as LeadProfile) : {};
  const pageContext = resolveAssistantPageContext(pathname);

  if (!message) {
    return NextResponse.json({ error: "A visitor message is required." }, { status: 400 });
  }

  const config = getOpenAIConfig();
  if (!config.configured || !config.apiKey) {
    return NextResponse.json(
      { error: "The AI service is not configured yet.", setup: "Add OPENAI_API_KEY to the server environment and restart the app." },
      { status: 503 }
    );
  }

  const fullConversation: ConversationTurn[] = [...history, { role: "user", content: message }];
  const leadQualification = pageContext.mode === "services" ? qualifyLead(fullConversation, existingLead) : undefined;
  const knowledge = retrieveWascikKnowledge(
    `${message} ${history.filter((turn) => turn.role === "user").map((turn) => turn.content).join(" ")}`,
    pageContext.allowedTopics,
    5
  );

  const knowledgeText = knowledge.length
    ? knowledge.map((fact) => `- ${fact.text}`).join("\n")
    : "- No additional approved WASCIK facts were retrieved for this request.";

  const leadText = leadQualification
    ? [
        `Lead status: ${leadQualification.status}; score: ${leadQualification.score}/100.`,
        `Known lead profile: ${JSON.stringify(leadQualification.profile)}.`,
        `Missing core qualification fields: ${leadQualification.missingFields.join(", ") || "none"}.`,
        leadQualification.nextQuestion ? `Preferred next qualification question: ${leadQualification.nextQuestion}` : "The lead is ready for handoff.",
      ].join("\n")
    : "";

  const instructions = [
    "You are the WASCIK Digital Representative, a concise, helpful website representative.",
    `Current page role: ${pageContext.role}.`,
    `Current page path: ${pageContext.pathname}.`,
    pageContext.merchant ? `Current affiliate merchant: ${pageContext.merchant}.` : "",
    `Allowed topics: ${pageContext.allowedTopics.join(", ")}.`,
    `Preferred actions: ${pageContext.preferredActions.join(", ")}.`,
    "Use the approved knowledge below as the source of truth for WASCIK business facts. Do not invent prices, products, guarantees, policies, availability, client results, or capabilities not present in the approved knowledge or page context.",
    "APPROVED WASCIK KNOWLEDGE:",
    knowledgeText,
    leadText ? "LEAD QUALIFICATION STATE:" : "",
    leadText,
    "Remember information already provided in the conversation. Never ask for a detail that is already present in the known lead profile or conversation history.",
    "Keep lead qualification light and natural. Only project type, business/project context, and one contact method are core handoff requirements.",
    "Budget and timeline are useful optional details: remember them when volunteered or when directly relevant to the visitor's question, but do not automatically interrogate every visitor for them.",
    "Ask at most one qualification question in a reply. Prefer answering the visitor's current question first. Do not turn the conversation into a questionnaire.",
    "If the visitor has already answered a qualification question, acknowledge/use that answer before asking anything else. Only revisit a detail if their earlier answer was genuinely ambiguous.",
    "If the lead is handoff-ready, stop qualification questions and give a short summary of what WASCIK knows. Tell the visitor that their project details can now be passed to WASCIK for follow-up.",
    "If a visitor asks for a fact that is not in the approved knowledge, say you do not have that detail yet and guide them toward the appropriate WASCIK contact or page.",
    "Keep replies conversational and usually under 110 words unless the visitor clearly asks for more detail.",
    pageContext.mode === "shopping" ? "For specific product recommendations, use only the shopping-guide flow and supplied catalog data rather than inventing a product." : "",
    pageContext.disclosureRequired ? "When discussing affiliate shopping, clearly acknowledge that WASCIK may earn a commission through affiliate links at no additional cost to the shopper." : "",
  ]
    .filter(Boolean)
    .join("\n");

  const input = fullConversation.map((turn) => ({ role: turn.role, content: turn.content }));

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        instructions,
        input,
        reasoning: { effort: "minimal" },
        max_output_tokens: 800,
        store: false,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as ResponsesPayload;
    if (!response.ok) {
      console.error("OpenAI Responses API error", response.status, data);
      return NextResponse.json({ error: "The representative could not respond right now." }, { status: 502 });
    }

    const text = extractResponseText(data);
    if (!text) {
      console.error("OpenAI response contained no visible text", {
        status: data.status,
        incompleteReason: data.incomplete_details?.reason,
        apiError: data.error?.message,
      });
      return NextResponse.json(
        { error: data.status === "incomplete" ? "The representative ran out of response capacity. Please try again." : "The representative returned an empty response." },
        { status: 502 }
      );
    }

    let leadPersistence: Awaited<ReturnType<typeof persistQualifiedLead>> | undefined;
    if (leadQualification?.status === "handoff-ready") {
      leadPersistence = await persistQualifiedLead({
        profile: leadQualification.profile,
        pathname,
        summary: text,
        conversation: [...fullConversation, { role: "assistant", content: text }],
        qualificationScore: leadQualification.score,
        qualificationStatus: leadQualification.status,
        sessionId: typeof body.sessionId === "string" ? body.sessionId : undefined,
        referrer: request.headers.get("referer") || undefined,
      });
    }

    return NextResponse.json({
      text,
      pageContext,
      leadQualification,
      leadPersistence,
      knowledgeIds: knowledge.map((fact) => fact.id),
      mode: "live-openai-stage6",
      handoffReady: leadQualification?.status === "handoff-ready" || false,
    });
  } catch (error) {
    console.error("WASCIK AI assistant request failed", error);
    return NextResponse.json({ error: "The representative could not respond right now." }, { status: 502 });
  }
}
