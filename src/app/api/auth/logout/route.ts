import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(USER_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  return res;
}
