import { NextResponse } from "next/server";

const replies: Record<string, string> = {
  service: "I can explain services, collect project details, and help route a visitor toward a consultation or human follow-up.",
  retail: "I can help compare products, explain features, guide shoppers to the right category, and keep the buying path clear.",
  church: "I can answer common visitor questions about services, events, ministries, directions, and ways to connect with the organization.",
  custom: "I can be configured around approved business knowledge, the company's voice, and the actions visitors should take next.",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1200) : "";
  const businessType = typeof body.businessType === "string" ? body.businessType : "custom";

  if (!message) {
    return NextResponse.json({ error: "A visitor message is required." }, { status: 400 });
  }

  return NextResponse.json({
    text: replies[businessType] ?? replies.custom,
    mode: "stage-3-backend-contract",
    handoffReady: true,
  });
}
