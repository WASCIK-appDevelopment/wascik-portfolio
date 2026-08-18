import { NextResponse } from "next/server";
import { getStage6Config } from "../../../../../lib/ai/stage6Config";

const OWNER_HEADER = "x-wascik-owner-key";
const BUCKET = "affiliate-product-images";
const MAX_FILE_SIZE = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function authorized(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  return Boolean(expected && provided && provided === expected);
}

function extensionFor(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "gif";
}

function safePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "product";
}

function storageHeaders(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = getStage6Config();
  if (!config.supabaseServerKey) {
    return NextResponse.json({ error: "Supabase storage is not configured." }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const productId = typeof form?.get("productId") === "string" ? String(form?.get("productId")) : "product";
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP, or GIF photo." }, { status: 400 });
  }
  if (!file.size || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "The photo must be smaller than 6 MB." }, { status: 400 });
  }

  const base = config.supabaseUrl.replace(/\/$/, "");
  const headers = storageHeaders(config.supabaseServerKey);
  const bucketCheck = await fetch(`${base}/storage/v1/bucket/${BUCKET}`, { headers, cache: "no-store" });
  if (bucketCheck.status === 404) {
    const createBucket = await fetch(`${base}/storage/v1/bucket`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: BUCKET,
        name: BUCKET,
        public: true,
        file_size_limit: MAX_FILE_SIZE,
        allowed_mime_types: Array.from(ALLOWED_TYPES),
      }),
    });
    if (!createBucket.ok && createBucket.status !== 409) {
      const detail = await createBucket.text().catch(() => "");
      return NextResponse.json({ error: detail || "Could not prepare photo storage." }, { status: 502 });
    }
  } else if (!bucketCheck.ok) {
    return NextResponse.json({ error: "Could not connect to photo storage." }, { status: 502 });
  }

  const objectPath = `manual/${safePart(productId)}-${Date.now()}.${extensionFor(file.type)}`;
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  const upload = await fetch(`${base}/storage/v1/object/${BUCKET}/${encodedPath}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": file.type, "x-upsert": "false" },
    body: await file.arrayBuffer(),
  });
  if (!upload.ok) {
    const detail = await upload.text().catch(() => "");
    return NextResponse.json({ error: detail || "The photo could not be uploaded." }, { status: 502 });
  }

  const imageUrl = `${base}/storage/v1/object/public/${BUCKET}/${encodedPath}`;
  return NextResponse.json({ imageUrl, sourceImageUrl: imageUrl, message: "Your photo was attached to this product." });
}
