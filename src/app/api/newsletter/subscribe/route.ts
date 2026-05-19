import { NextResponse } from "next/server";

/** Suscripciones pausadas hasta activar envío por correo (tablas `subscribers` / n8n intactas). */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "El newsletter está temporalmente desactivado. Aún no enviamos correos; vuelve más adelante cuando activemos el envío.",
    },
    { status: 410 },
  );
}
