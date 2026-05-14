import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return url;
  // Durante `next build` Next puede evaluar rutas; placeholder sin conexión real.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgresql://build:build@127.0.0.1:5432/build";
  }
  throw new Error("DATABASE_URL no está definida");
}

const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  drizzle?: ReturnType<typeof drizzle>;
};

function getClient() {
  const url = getDatabaseUrl();
  if (!globalForDb.client) {
    globalForDb.client = postgres(url, {
      max: 4,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForDb.client;
}

export const db =
  globalForDb.drizzle ?? (globalForDb.drizzle = drizzle(getClient(), { schema }));
export { schema };
