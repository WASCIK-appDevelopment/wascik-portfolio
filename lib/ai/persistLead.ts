import { createHash } from "crypto";
import { ConversationTurn, LeadProfile } from "./leadQualification";
import { getStage6Config } from "./stage6Config";

export type PersistLeadInput = {
  profile: LeadProfile;
  pathname: string;
  summary: string;
  conversation: ConversationTurn[];
  qualificationScore?: number;
  qualificationStatus?: string;
  sessionId?: string;
  referrer?: string;
};

export type PersistLeadResult =
  | { saved: true; leadId?: string; alertSentAt?: string; configured: true }
  | { saved: false; configured: boolean; reason: string; detail?: string };

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function captureKey(input: PersistLeadInput) {
  const email = clean(input.profile.email, 320).toLowerCase();
  const phone = clean(input.profile.phone, 80).replace(/\D/g, "");
  const sessionId = clean(input.sessionId, 160);
  const source = email || phone ? `${sessionId}|${email}|${phone}` : "";
  if (!source) return undefined;
  return createHash("sha256").update(source).digest("hex");
}

export async function persistQualifiedLead(input: PersistLeadInput): Promise<PersistLeadResult> {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) {
    return { saved: false, configured: false, reason: "database_not_configured" };
  }

  const email = clean(input.profile.email, 320);
  const phone = clean(input.profile.phone, 80);
  const business = clean(input.profile.business, 180);
  const projectType = clean(input.profile.projectType, 120);

  // Stage 6 capture rule: a usable contact method is enough to create the lead.
  // Additional project details enrich the same row as the conversation continues.
  if (!email && !phone) {
    return { saved: false, configured: true, reason: "contact_not_available" };
  }

  const key = captureKey(input);
  const record = {
    capture_key: key ?? null,
    session_id: clean(input.sessionId, 160) || null,
    name: clean(input.profile.name, 160) || null,
    email: email || null,
    phone: phone || null,
    business: business || null,
    project_type: projectType || null,
    goals: Array.isArray(input.profile.goals) ? input.profile.goals.slice(0, 20).map((item) => clean(item, 240)).filter(Boolean) : [],
    features: Array.isArray(input.profile.features) ? input.profile.features.slice(0, 20).map((item) => clean(item, 240)).filter(Boolean) : [],
    budget: clean(input.profile.budget, 160) || null,
    timeline: clean(input.profile.timeline, 160) || null,
    source_page: clean(input.pathname, 500) || "/",
    source_path: clean(input.pathname, 500) || "/",
    source_referrer: clean(input.referrer, 1000) || null,
    summary: clean(input.summary, 1600) || (projectType ? `Visitor is interested in a ${projectType} project.` : "Visitor provided contact information for WASCIK follow-up."),
    conversation: input.conversation.slice(-12),
    qualification_score: typeof input.qualificationScore === "number" ? Math.max(0, Math.min(100, Math.round(input.qualificationScore))) : null,
    qualification_status: clean(input.qualificationStatus, 80) || null,
  };

  const headers: Record<string, string> = {
    apikey: config.supabaseServerKey,
    "Content-Type": "application/json",
  };

  if (config.supabaseKeyKind === "service_role") {
    headers.Authorization = `Bearer ${config.supabaseServerKey}`;
  }

  const resultFromRows = (rows: Array<{ id?: string; alert_sent_at?: string | null }>): PersistLeadResult => ({
    saved: true,
    configured: true,
    leadId: rows[0]?.id,
    alertSentAt: rows[0]?.alert_sent_at || undefined,
  });

  const patchExisting = async (leadId: string) => {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(leadId)}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(record),
      },
    );
    const rows = (await response.json().catch(() => [])) as Array<{ id?: string; alert_sent_at?: string | null }>;
    return { response, rows };
  };

  const findExisting = async () => {
    if (!key) return undefined;
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/leads?capture_key=eq.${encodeURIComponent(key)}&select=id,alert_sent_at&limit=1`,
      { headers, cache: "no-store" },
    );
    if (!response.ok) return undefined;
    const rows = (await response.json().catch(() => [])) as Array<{ id?: string; alert_sent_at?: string | null }>;
    return rows[0];
  };

  // Existing leads are patched without a status field. This guarantees that
  // owner-managed workflow states survive later AI conversation enrichment.
  const existing = await findExisting();
  if (existing?.id) {
    const { response, rows } = await patchExisting(existing.id);
    if (response.ok) return resultFromRows(rows);
    const detail = await response.text().catch(() => "");
    console.error("Stage 6 lead enrichment failed", response.status, detail);
    return { saved: false, configured: true, reason: "database_update_failed", detail: `${response.status}: ${detail.slice(0, 300)}` };
  }

  // Only a brand-new row receives the initial workflow status.
  const insertResponse = await fetch(`${config.supabaseUrl}/rest/v1/leads`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ ...record, status: "new" }),
  });
  if (insertResponse.ok) {
    const rows = (await insertResponse.json().catch(() => [])) as Array<{ id?: string; alert_sent_at?: string | null }>;
    return resultFromRows(rows);
  }

  // A concurrent request may have inserted the capture key after our lookup.
  // Resolve that race by finding and enriching the now-existing row.
  if (insertResponse.status === 409 && key) {
    const raced = await findExisting();
    if (raced?.id) {
      const { response, rows } = await patchExisting(raced.id);
      if (response.ok) return resultFromRows(rows);
    }
  }

  const detail = await insertResponse.text().catch(() => "");
  console.error("Stage 6 lead persistence failed", insertResponse.status, detail);
  return {
    saved: false,
    configured: true,
    reason: "database_insert_failed",
    detail: `${insertResponse.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`,
  };
}


export async function markLeadAlertSent(leadId: string, sentAt = new Date().toISOString()) {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey || !leadId) {
    return { recorded: false, reason: "database_not_configured" };
  }

  const headers: Record<string, string> = {
    apikey: config.supabaseServerKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (config.supabaseKeyKind === "service_role") {
    headers.Authorization = `Bearer ${config.supabaseServerKey}`;
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/leads?id=eq.${encodeURIComponent(leadId)}&alert_sent_at=is.null`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ alert_sent_at: sentAt }),
    },
  );
  const rows = (await response.json().catch(() => [])) as Array<{ id?: string; alert_sent_at?: string | null }>;
  if (!response.ok) {
    const detail = JSON.stringify(rows).slice(0, 300);
    console.error("Stage 6 alert timestamp update failed", response.status, detail);
    return { recorded: false, reason: "database_update_failed", detail };
  }

  return { recorded: rows.length > 0, alreadyRecorded: rows.length === 0, alertSentAt: rows[0]?.alert_sent_at || sentAt };
}
