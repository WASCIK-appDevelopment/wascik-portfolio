import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const CURRENT_ID = "current";
const BUCKET = "owner-ad-work-progress";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function headers(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function extensionFor(type: string) {
  if (type.includes("mp4") || type.includes("m4a")) return "m4a";
  if (type.includes("mpeg")) return "mp3";
  return "webm";
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return NextResponse.json({ error: "Ad workspace storage is not configured." }, { status: 503 });
  const form = await request.formData();
  const value = form.get("file");
  if (!(value instanceof File)) return NextResponse.json({ error: "Voice recording is required." }, { status: 400 });
  if (!value.type.startsWith("audio/") || value.size <= 0 || value.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Voice recording must be an audio file under 20 MB." }, { status: 400 });

  const path = `current/voice.${extensionFor(value.type)}`;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const upload = await fetch(`${config.supabaseUrl}/storage/v1/object/${BUCKET}/${encoded}`, {
    method: "POST",
    headers: { apikey: config.supabaseServerKey, Authorization: `Bearer ${config.supabaseServerKey}`, "Content-Type": value.type, "x-upsert": "true", "Cache-Control": "3600" },
    body: Buffer.from(await value.arrayBuffer()),
  });
  if (!upload.ok) return NextResponse.json({ error: "Could not save the voice recording." }, { status: 502 });

  const update = await fetch(`${config.supabaseUrl}/rest/v1/owner_ad_work_progress?id=eq.${CURRENT_ID}`, {
    method: "PATCH",
    headers: headers(config.supabaseServerKey),
    body: JSON.stringify({ voice_storage_path: path, voice_mime_type: value.type, updated_at: new Date().toISOString() }),
  });
  if (!update.ok) return NextResponse.json({ error: "Voice recording stored but could not be attached to the draft." }, { status: 502 });
  return NextResponse.json({ saved: true, path });
}
