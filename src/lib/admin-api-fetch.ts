/** Peticiones del panel admin con cookies de sesión y mensajes de error claros. */
export async function adminApiFetch<T = unknown>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(input, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "Conexión cortada (timeout del proxy). El procesamiento con DeepSeek tarda; usa «Procesar» en un ítem o «Procesar todo» (uno por uno).",
      );
    }
    throw e;
  }

  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (!res.ok) {
        throw new Error(`Error del servidor (${res.status})`);
      }
      throw new Error("Respuesta inválida del servidor");
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        "No autorizado. Entra en /admin/login con la contraseña del panel o inicia sesión con Google (email admin).",
      );
    }
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : `Error (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
