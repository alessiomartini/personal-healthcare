import { NextRequest, NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = body.password ?? "";
  if (!password || !checkPassword(password)) {
    return NextResponse.json({ error: "Password errata" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Only mark the cookie Secure when actually served over HTTPS. Many private
    // deployments (home network, Tailscale/VPN) run over plain HTTP on purpose,
    // and a Secure cookie would silently never be sent there, breaking login.
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
