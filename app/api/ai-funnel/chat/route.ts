import { NextResponse } from "next/server";
import { resolveAssistantPageContext } from "../../../../lib/ai/pageContext";

const replies: Record<string, string> = {
  services: "I can explain WASCIK services, qualify the project, and guide a visitor toward starting a project or reaching the team.",
  shopping: "I can help a shopper discover relevant products, compare listed options, and guide them through WASCIK affiliate pages while preserving the required disclosure.",
  owner: "I can help prepare WASCIK social media content, short-form video scripts, ad concepts, and reusable content ideas for the private owner workspace.",
  general: "I can help the visitor navigate the WASCIK site and get to the right service, affiliate section, or next step.",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 1200) : "";
  const pathname = typeof body.pathname === "string" ? body.pathname.trim() : "/";
  const pageContext = resolveAssistantPageContext(pathname);

  if (!message) {
    return NextResponse.json({ error: "A visitor message is required." }, { status: 400 });
  }

  return NextResponse.json({
    text: replies[pageContext.mode] ?? replies.general,
    pageContext,
    mode: "page-aware-backend-contract",
    handoffReady: pageContext.mode !== "owner",
  });
}
