import { createHmac, timingSafeEqual } from "node:crypto";

const IMAGE_PROXY_PATH = "/api/owner/affiliate-search/image";

function secret() {
  return process.env.WASCIK_OWNER_CONSOLE_KEY?.trim() || "";
}

export function safeAffiliateImageUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (host === "localhost" || host.endsWith(".local") || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return null;
    const private172 = host.match(/^172\.(\d+)\./);
    if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return null;
    return url;
  } catch {
    return null;
  }
}

function signature(value: string) {
  const key = secret();
  return key ? createHmac("sha256", key).update(value).digest("base64url") : "";
}

export function proxiedAffiliateImageUrl(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("/")) return value;
  const url = safeAffiliateImageUrl(value);
  if (!url) return null;
  const normalized = url.toString();
  const sig = signature(normalized);
  if (!sig) return normalized;
  const query = new URLSearchParams({ url: normalized, sig });
  return `${IMAGE_PROXY_PATH}?${query.toString()}`;
}

export function verifyAffiliateImageSignature(value: string, provided: string) {
  const expected = signature(value);
  if (!expected || !provided || expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
