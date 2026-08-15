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
  | { saved: true; leadId?: string; configured: true }
  | { saved: false; configured: boolean; reason: string; detail?: string };

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function captureKey(input: PersistLeadInput) {
  const source = [
    clean(input.sessionId, 160),
    clean(input.profile.email, 320).toLowerCase(),
    clean(input.profile.phone, 80),
    clean(input.profile.business, 180).toLowerCase(),
    clean(input.profile.projectType, 120).toLowerCase(),
  ]
    .filter(Boolean)
    .join("|");

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

  if (!business || !projectType || (!email && !phone)) {
    return { saved: false, configured: true, reason: "lead_not_handoff_ready" };
  }

  const key = captureKey(input);
  const record = {
    capture_key: key ?? null,
    session_id: clean(input.sessionId, 160) || null,
    status: "new",
    name: clean(input.profile.name, 160) || null,
    email: email || null,
    phone: phone || null,
    business,
    project_type: projectType,
    goals: Array.isArray(input.profile.goals) ? input.profile.goals.slice(0, 20).map((item) => clean(item, 240)).filter(Boolean) : [],
    features: Array.isArray(input.profile.features) ? input.profile.features.slice(0, 20).map((item) => clean(item, 240)).filter(Boolean) : [],
    budget: clean(input.profile.budget, 160) || null,
    timeline: clean(input.profile.timeline, 160) || null,
    source_page: clean(input.pathname, 500) || "/",
    source_path: clean(input.pathname, 500) || "/",
    source_referrer: clean(input.referrer, 1000) || null,
    summary: clean(input.summary, 1600) || `${business} is interested in a ${projectType} project.`,
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

  const attempts = [
    {
      url: `${config.supabaseUrl}/rest/v1/leads?on_conflict=capture_key`,
      prefer: "resolution=merge-duplicates,return=representation",
    },
    {
      url: `${config.supabaseUrl}/rest/v1/leads`,
      prefer: "return=representation",
    },
  ];

  let lastStatus = 0;
  let lastDetail = "";

  for (const attempt of attempts) {
    const response = await fetch(attempt.url, {
      method: "POST",
      headers: { ...headers, Prefer: attempt.prefer },
      body: JSON.stringify(record),
    });

    if (response.ok) {
      const rows = (await response.json().catch(() => [])) as Array<{ id?: string }>;
      return { saved: true, configured: true, leadId: rows[0]?.id };
    }

    lastStatus = response.status;
    lastDetail = await response.text().catch(() => "");

    // A duplicate on the fallback insert means the original upsert effectively found an existing lead.
    if (response.status === 409 && key) {
      return { saved: true, configured: true };
    }
  }

  console.error("Stage 6 lead persistence failed", lastStatus, lastDetail);
  return {
    saved: false,
    configured: true,
    reason: "database_insert_failed",
    detail: `${lastStatus}${lastDetail ? `: ${lastDetail.slice(0, 300)}` : ""}`,
  };
}
