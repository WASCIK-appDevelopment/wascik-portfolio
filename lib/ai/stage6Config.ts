export type Stage6Config = {
  supabaseUrl: string;
  supabaseServerKey?: string;
  supabaseKeyKind?: "secret" | "service_role";
  resendApiKey?: string;
  alertEmail?: string;
  alertFrom?: string;
  databaseConfigured: boolean;
  emailConfigured: boolean;
};

const WASCIK_SUPABASE_URL = "https://jvbfmrcqixnlhnqqkppy.supabase.co";

export function getStage6Config(): Stage6Config {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || WASCIK_SUPABASE_URL;
  const modernSecretKey = process.env.SUPABASE_SECRET_KEY?.trim();
  const legacyServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseServerKey = modernSecretKey || legacyServiceRoleKey;
  const supabaseKeyKind = modernSecretKey ? "secret" : legacyServiceRoleKey ? "service_role" : undefined;
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const alertEmail = process.env.WASCIK_ALERT_EMAIL?.trim();
  const alertFrom = process.env.WASCIK_ALERT_FROM?.trim();

  return {
    supabaseUrl,
    supabaseServerKey,
    supabaseKeyKind,
    resendApiKey,
    alertEmail,
    alertFrom,
    databaseConfigured: Boolean(supabaseUrl && supabaseServerKey),
    emailConfigured: Boolean(resendApiKey && alertEmail && alertFrom),
  };
}
