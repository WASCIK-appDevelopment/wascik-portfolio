import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";
import { resolveAssistantPageContext } from "../../../../lib/ai/pageContext";

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

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1200) : "";
  const pathname = typeof body.pathname === "string" ? body.pathname.trim() : "/";
  const pageContext = resolveAssistantPageContext(pathname);

  if (!message) {
    return NextResponse.json({ error: "A visitor message is required." }, { status: 400 });
  }

  const config = getOpenAIConfig();
  if (!config.configured || !config.apiKey) {
    return NextResponse.json(
      {
        error: "The AI service is not configured yet.",
        setup: "Add OPENAI_API_KEY to the server environment and restart the app.",
      },
      { status: 503 }
    );
  }

  const instructions = [
    "You are the WASCIK Digital Representative, a concise and helpful website assistant.",
    `Current page role: ${pageContext.role}.`,
    `Current page path: ${pageContext.pathname}.`,
    pageContext.merchant ? `Current affiliate merchant: ${pageContext.merchant}.` : "",
    `Allowed topics: ${pageContext.allowedTopics.join(", ")}.`,
    `Preferred actions: ${pageContext.preferredActions.join(", ")}.`,
    "Stay within the supplied page context. Do not invent prices, products, guarantees, policies, availability, client results, or business facts that were not supplied.",
    "If a visitor asks for a fact you do not have, say you do not have that detail yet and guide them toward the appropriate WASCIK contact or page.",
    "Keep replies conversational and usually under 90 words unless the visitor clearly asks for more detail.",
    pageContext.mode === "shopping"
      ? "For specific product recommendations, direct the visitor to the shopping-guide flow rather than inventing a product."
      : "",
    pageContext.disclosureRequired
      ? "When discussing affiliate shopping, clearly acknowledge that WASCIK may earn a commission through affiliate links at no additional cost to the shopper."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        instructions,
        input: message,
        reasoning: { effort: "minimal" },
        max_output_tokens: 800,
        store: false,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as ResponsesPayload;

    if (!response.ok) {
      console.error("OpenAI Responses API error", response.status, data);
      return NextResponse.json(
        { error: "The representative could not respond right now." },
        { status: 502 }
      );
    }

    const text = extractResponseText(data);
    if (!text) {
      console.error("OpenAI response contained no visible text", {
        status: data.status,
        incompleteReason: data.incomplete_details?.reason,
        apiError: data.error?.message,
      });
      return NextResponse.json(
        {
          error:
            data.status === "incomplete"
              ? "The representative ran out of response capacity. Please try again."
              : "The representative returned an empty response.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      text,
      pageContext,
      mode: "live-openai-page-aware",
      handoffReady: pageContext.mode !== "owner",
    });
  } catch (error) {
    console.error("WASCIK AI assistant request failed", error);
    return NextResponse.json(
      { error: "The representative could not respond right now." },
      { status: 502 }
    );
  }
}
