import crypto from "node:crypto";
import { cookies } from "next/headers";

export const OWNER_STUDIO_COOKIE = "wascik_owner_studio";

function configuredSecret() {
  return process.env.OWNER_STUDIO_ACCESS_KEY ?? "";
}

export function ownerSessionToken() {
  const secret = configuredSecret();
  if (!secret) return "";
  return crypto.createHash("sha256").update(`wascik-owner-studio:${secret}`).digest("hex");
}

export function isValidOwnerAccessKey(candidate: string) {
  const secret = configuredSecret();
  if (!secret || !candidate) return false;

  const expected = Buffer.from(secret);
  const provided = Buffer.from(candidate);
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

export async function hasOwnerStudioSession() {
  const token = ownerSessionToken();
  if (!token) return false;
  const jar = await cookies();
  return jar.get(OWNER_STUDIO_COOKIE)?.value === token;
}
