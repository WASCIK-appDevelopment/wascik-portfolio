import { LeadProfile } from "./leadQualification";
import { getStage6Config } from "./stage6Config";

export type LeadAlertInput = {
  profile: LeadProfile;
  pathname: string;
  leadId?: string;
};

export type LeadAlertResult =
  | { sent: true; configured: true; emailId?: string }
  | { sent: false; configured: boolean; reason: string; detail?: string };

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function sendLeadAlert(input: LeadAlertInput): Promise<LeadAlertResult> {
  const config = getStage6Config();
  if (!config.emailConfigured || !config.resendApiKey || !config.alertEmail || !config.alertFrom) {
    return { sent: false, configured: false, reason: "email_not_configured" };
  }

  const projectType = clean(input.profile.projectType, 120) || "project";
  const business = clean(input.profile.business, 160);
  const source = clean(input.pathname, 300) || "/";
  const name = clean(input.profile.name, 160);

  const subject = `New WASCIK ${projectType} lead`;
  const lines = [
    "A new lead was captured by the WASCIK AI assistant.",
    "",
    name ? `Name: ${name}` : "",
    business ? `Business: ${business}` : "",
    `Project: ${projectType}`,
    `Source: ${source}`,
    "",
    "Check the WASCIK lead database/dashboard for contact information and full conversation details.",
  ].filter(Boolean);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.alertFrom,
      to: [config.alertEmail],
      subject,
      text: lines.join("\n"),
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
  if (!response.ok) {
    console.error("Stage 6 Resend lead alert failed", response.status, payload);
    return { sent: false, configured: true, reason: "email_send_failed", detail: `${response.status}: ${payload.message || payload.name || "unknown Resend error"}` };
  }

  return { sent: true, configured: true, emailId: payload.id };
}
