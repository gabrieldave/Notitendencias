import { NextResponse } from "next/server";
import { getOptionalSessionUser, userHasPremium, type PublicUser } from "@/lib/session-user";

type GateOk = { user: PublicUser };
type GateErr = { error: NextResponse };

export async function requireApiUser(): Promise<GateOk | GateErr> {
  const user = await getOptionalSessionUser();
  if (!user) {
    return { error: NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 }) };
  }
  return { user };
}

export async function requireApiPremiumUser(): Promise<GateOk | GateErr> {
  const gate = await requireApiUser();
  if ("error" in gate) return gate;
  if (!userHasPremium(gate.user)) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Activa Notitendencias AI Radar para usar Mi radar." },
        { status: 403 },
      ),
    };
  }
  return gate;
}
