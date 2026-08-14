export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  return {
    configured: Boolean(apiKey),
    apiKey,
    model: process.env.OPENAI_MODEL?.trim() || "gpt-5-mini",
  };
}
