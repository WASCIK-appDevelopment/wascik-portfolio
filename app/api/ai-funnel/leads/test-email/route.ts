import { NextResponse } from "next/server";
import { sendLeadAlert } from "../../../../../lib/ai/sendLeadAlert";

export async function GET() {
  const result = await sendLeadAlert({
    profile: {
      projectType: "website",
      business: "Stage 6 email test",
      name: "Test Lead",
    },
    pathname: "/api/ai-funnel/leads/test-email",
  });

  return NextResponse.json(result, { status: result.sent ? 200 : 502 });
}
