import { NextResponse } from "next/server";
import { getOptionalSessionUser } from "@/lib/session-user";
import { isRadarContentUnlocked } from "@/lib/radar-access";

export const dynamic = "force-dynamic";

/** Estado de sesión para el cliente (evita depender solo de RSC cacheado). */
export async function GET() {
  const user = await getOptionalSessionUser();
  if (!user) {
    return NextResponse.json({ ok: true, user: null, radarUnlocked: false });
  }
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      role: user.role,
    },
    radarUnlocked: isRadarContentUnlocked(user),
  });
}
