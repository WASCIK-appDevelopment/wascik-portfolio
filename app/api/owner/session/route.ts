import { NextResponse } from "next/server";

const OWNER_HEADER = "x-wascik-owner-key";

export async function GET(request: Request) {
  const expected = process.env.WASCIK_OWNER_CONSOLE_KEY?.trim();
  const provided = request.headers.get(OWNER_HEADER)?.trim();
  const authorized = Boolean(expected && provided && provided === expected);

  if (!authorized) {
    return NextResponse.json({ authorized: false }, { status: 401 });
  }

  return NextResponse.json({ authorized: true, console: "WASCIK Owner Console" });
}
