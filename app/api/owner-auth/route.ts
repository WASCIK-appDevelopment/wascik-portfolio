import { NextResponse } from "next/server";
import { isValidOwnerAccessKey, OWNER_STUDIO_COOKIE, ownerSessionToken } from "../../../lib/ownerStudioAuth";

export async function POST(request: Request) {
  const data = await request.json().catch(() => ({}));
  const accessKey = typeof data.accessKey === "string" ? data.accessKey : "";

  if (!process.env.OWNER_STUDIO_ACCESS_KEY) {
    return NextResponse.json({ error: "Owner Studio is not configured." }, { status: 503 });
  }

  if (!isValidOwnerAccessKey(accessKey)) {
    return NextResponse.json({ error: "Access denied." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OWNER_STUDIO_COOKIE, ownerSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 43200,
  });
  return response;
}
