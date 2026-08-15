import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

export async function GET() {
  const config = getStage6Config();
  let databaseReachable = false;
  let databaseStatus: number | null = null;

  if (config.databaseConfigured && config.supabaseServerKey) {
    const headers: Record<string, string> = {
      apikey: config.supabaseServerKey,
      Accept: "application/json",
    };

    if (config.supabaseKeyKind === "service_role") {
      headers.Authorization = `Bearer ${config.supabaseServerKey}`;
    }

    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/leads?select=id&limit=1`, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      databaseStatus = response.status;
      databaseReachable = response.ok;
    } catch {
      databaseReachable = false;
    }
  }

  return NextResponse.json({
    databaseConfigured: config.databaseConfigured,
    databaseReachable,
    databaseStatus,
    keyKind: config.supabaseKeyKind || null,
    emailConfigured: config.emailConfigured,
    alertEmailConfigured: Boolean(config.alertEmail),
    senderConfigured: Boolean(config.alertFrom),
  });
}
