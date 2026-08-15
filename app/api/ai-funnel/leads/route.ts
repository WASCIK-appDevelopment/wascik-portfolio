import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../lib/ai/stage6Config";

type LeadPayload = {
  sessionId?: string;
  sourcePage?: string;
  summary?: string;
  profile?: {
    name?: string;
    email?: string;
    phone?: string;
    business?: string;
    projectType?: string;
    budget?: string;
    timeline?: string;
  };
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

async function sendAlert(payload: LeadPayload, leadId: string | number) {
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
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Lead storage is not configured yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as LeadPayload;
  const profile = body.profile ?? {};
  const contactEmail = clean(profile.email, 320);
  const contactPhone = clean(profile.phone, 80);
  const projectType = clean(profile.projectType, 120);
  const business = clean(profile.business, 180);

  if (!projectType || !business || (!contactEmail && !contactPhone)) {
    return NextResponse.json({ error: "The lead is not ready for handoff yet." }, { status: 400 });
  }

  const record = {
    session_id: clean(body.sessionId, 120) || null,
    source_page: clean(body.sourcePage, 500) || "/",
    status: "new",
    name: clean(profile.name, 160) || null,
    email: contactEmail || null,
    phone: contactPhone || null,
    business,
    project_type: projectType,
    budget: clean(profile.budget, 160) || null,
    timeline: clean(profile.timeline, 160) || null,
    summary: clean(body.summary, 1200) || `${business} is interested in a ${projectType} project.`,
  };

  const databaseResponse = await fetch(`${config.supabaseUrl}/rest/v1/wascik_leads`, {
    method: "POST",
    headers: {
      apikey: config.supabaseServiceRoleKey,
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });

  if (!databaseResponse.ok) {
    const detail = await databaseResponse.text().catch(() => "");
    console.error("Stage 6 lead database insert failed", databaseResponse.status, detail);
    return NextResponse.json({ error: "The lead could not be saved right now." }, { status: 502 });
  }

  const rows = (await databaseResponse.json().catch(() => [])) as Array<{ id?: string | number }>;
  const leadId = rows[0]?.id ?? `captured-${Date.now()}`;
  const alert = await sendAlert(body, leadId);

  return NextResponse.json({
    saved: true,
    leadId,
    status: "new",
    alert,
  });
}
