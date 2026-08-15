import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";

export async function GET() {
  const config = getOpenAIConfig();
  if (!config.configured || !config.apiKey) {
    return NextResponse.json({ configured: false, responseApiWorking: false, reason: "OPENAI_API_KEY is not loaded" }, { status: 503 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        input: "Reply with exactly: WASCIK OK",
        reasoning: { effort: "minimal" },
        max_output_tokens: 40,
        store: false,
      }),
    });

    const payload = await response.json().catch(() => ({})) as {
      error?: { message?: string; type?: string; code?: string };
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    if (!response.ok) {
      return NextResponse.json({
        configured: true,
        responseApiWorking: false,
        model: config.model,
        status: response.status,
        errorType: payload.error?.type || null,
        errorCode: payload.error?.code || null,
        detail: payload.error?.message || "OpenAI Responses API request failed",
      });
    }

    const text = (payload.output ?? [])
      .flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text?.trim())
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({ configured: true, responseApiWorking: true, model: config.model, text: text || null });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      responseApiWorking: false,
      model: config.model,
      reason: "network_or_runtime_error",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
