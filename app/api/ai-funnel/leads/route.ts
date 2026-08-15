import { NextResponse } from "next/server";
import { ConversationTurn, LeadProfile } from "../../../../lib/ai/leadQualification";
import { persistQualifiedLead } from "../../../../lib/ai/persistLead";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

type LeadPayload = {
  sessionId?: string;
  sourcePage?: string;
  referrer?: string;
  summary?: string;
  qualificationScore?: number;
  qualificationStatus?: string;
  conversation?: ConversationTurn[];
  profile?: LeadProfile;
};

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function buildAlertText(payload: LeadPayload) {
  const projectType = clean(payload.profile?.projectType, 120) || "project inquiry";
  const business = clean(payload.profile?.business, 160);
  const sourcePage = clean(payload.sourcePage, 300) || "unknown page";
  return {
    subject: `New WASCIK ${projectType} lead`,
    text: [
      `A new qualified WASCIK lead was captured${business ? ` for ${business}` : ""}.`,
      `Source: ${sourcePage}`,
      "Sign in to the WASCIK owner dashboard to review the full lead.",
    ].join("\n"),
  };
}

async function sendAlert(payload: LeadPayload, leadId: string) {
  const config = getStage6Config();
  if (!config.emailConfigured || !config.resendApiKey || !config.alertEmail || !config.alertFrom) {
    return { sent: false, reason: "email_not_configured" };
  }

  const alert = buildAlertText(payload);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `wascik-lead-${leadId}`,
    },
    body: JSON.stringify({
      from: config.alertFrom,
      to: [config.alertEmail],
      subject: alert.subject,
      text: alert.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Stage 6 lead alert failed", response.status, detail);
    return { sent: false, reason: "email_send_failed" };
  }

  return { sent: true };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LeadPayload;
  const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
  const conversation = Array.isArray(body.conversation) ? body.conversation.slice(-12) : [];

  const result = await persistQualifiedLead({
    profile,
    pathname: clean(body.sourcePage, 500) || "/",
    referrer: clean(body.referrer, 1000) || request.headers.get("referer") || undefined,
    summary: clean(body.summary, 1600),
    conversation,
    qualificationScore: typeof body.qualificationScore === "number" ? body.qualificationScore : undefined,
    qualificationStatus: clean(body.qualificationStatus, 80),
    sessionId: clean(body.sessionId, 160),
  });

  if (!result.saved) {
    const status = !result.configured ? 503 : result.reason === "lead_not_handoff_ready" ? 400 : 502;
    const error = !result.configured
      ? "Lead storage is not configured yet."
      : result.reason === "lead_not_handoff_ready"
        ? "The lead is not ready for handoff yet."
        : "The lead could not be saved right now.";
    return NextResponse.json({ error, reason: result.reason }, { status });
  }

  const leadId = result.leadId || `captured-${Date.now()}`;
  const alert = await sendAlert(body, leadId);

  return NextResponse.json({ saved: true, leadId, status: "new", alert });
}
