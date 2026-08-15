import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";

export async function GET() {
  const config = getOpenAIConfig();
  if (!config.configured || !config.apiKey) {
    return NextResponse.json({ configured: false, authenticated: false, reason: "OPENAI_API_KEY is missing" }, { status: 503 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof data?.error?.message === "string" ? data.error.message : "OpenAI authentication/request failed";
      return NextResponse.json({ configured: true, authenticated: false, status: response.status, reason: message }, { status: 502 });
    }
    return NextResponse.json({ configured: true, authenticated: true, model: config.model });
  } catch (error) {
    return NextResponse.json({ configured: true, authenticated: false, reason: error instanceof Error ? error.message : "OpenAI request failed" }, { status: 502 });
  }
}
