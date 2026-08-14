import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";
import { resolveAssistantPageContext } from "../../../../lib/ai/pageContext";

function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const data = payload as {
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  return (data.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text?.trim())
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
        max_output_tokens: 220,
        store: false,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("OpenAI Responses API error", response.status, data);
      return NextResponse.json(
        { error: "The representative could not respond right now." },
        { status: 502 }
      );
    }

    const text = extractResponseText(data);
    if (!text) {
      return NextResponse.json(
        { error: "The representative returned an empty response." },
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
