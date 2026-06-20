import { NextResponse } from "next/server";
import { isElevatedAdmin } from "@/lib/admin-auth";

/** Comprueba si la sesión actual puede usar acciones admin (cookie o Auth.js). */
export async function GET() {
  const elevated = await isElevatedAdmin();
  if (!elevated) {
    return NextResponse.json({ ok: false, elevated: false, error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, elevated: true });
}
