import { NextResponse } from "next/server";
import { getOpenAIConfig } from "../../../../lib/ai/openaiConfig";

export async function GET() {
  const config = getOpenAIConfig();

  return NextResponse.json({
    ok: true,
    configured: config.configured,
    model: config.model,
    service: "wascik-ai-assistant",
  });
}
