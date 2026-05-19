import { resolveAuthSecret } from "@/lib/auth-env";

/** @deprecated Usar resolveAuthSecret — alias para middleware Edge. */
export function resolveAuthSecretEdge(): string | undefined {
  return resolveAuthSecret();
}
