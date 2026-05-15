#!/usr/bin/env npx tsx
/**
 * Setup: verifica variables, aplica migraciones y seed.
 * Uso: `npm run setup` (requiere `.env` con DATABASE_URL, etc.)
 */
import "dotenv/config";
import { execSync } from "node:child_process";

const required = ["DATABASE_URL", "ADMIN_PASSWORD", "BRIDGE_API_KEY"] as const;

function main() {
  const missing = required.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    console.error("Faltan variables de entorno:", missing.join(", "));
    console.error("Copia .env.example a .env y complétalo.");
    process.exit(1);
  }

  console.log("→ Migraciones (drizzle-kit migrate)…");
  execSync("npx drizzle-kit migrate", { stdio: "inherit", env: process.env });

  console.log("→ Seed de categorías y fuentes…");
  execSync("npx tsx src/db/seed.ts", { stdio: "inherit", env: process.env });

  if (!process.env.USAGE_API_KEY?.trim()) {
    console.warn(
      "Aviso: USAGE_API_KEY no está definida. El panel /admin/usage funcionará, pero n8n no podrá registrar corridas hasta configurarla.",
    );
  }

  console.log("Listo. Puedes arrancar con `npm run dev` o desplegar en Coolify.");
}

main();
