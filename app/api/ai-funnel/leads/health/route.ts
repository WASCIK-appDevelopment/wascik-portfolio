import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

export async function GET() {
  const config = getStage6Config();
  return NextResponse.json({
    databaseConfigured: config.databaseConfigured,
    emailConfigured: config.emailConfigured,
    alertEmailConfigured: Boolean(config.alertEmail),
    senderConfigured: Boolean(config.alertFrom),
  });
}
