export type Stage6Config = {
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  resendApiKey?: string;
  alertEmail?: string;
  alertFrom?: string;
  databaseConfigured: boolean;
  emailConfigured: boolean;
};

export function getStage6Config(): Stage6Config {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const alertEmail = process.env.WASCIK_ALERT_EMAIL?.trim();
  const alertFrom = process.env.WASCIK_ALERT_FROM?.trim();

  return {
    supabaseUrl,
    supabaseServiceRoleKey,
    resendApiKey,
    alertEmail,
    alertFrom,
    databaseConfigured: Boolean(supabaseUrl && supabaseServiceRoleKey),
    emailConfigured: Boolean(resendApiKey && alertEmail && alertFrom),
  };
}
