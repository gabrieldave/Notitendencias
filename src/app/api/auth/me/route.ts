import { NextResponse } from "next/server";
import { getOptionalSessionUser } from "@/lib/user-session";

export async function GET() {
  const user = await getOptionalSessionUser();
  return NextResponse.json({ user });
}
