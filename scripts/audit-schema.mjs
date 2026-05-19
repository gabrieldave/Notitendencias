/**
 * Compara src/db/schema.ts (tablas Drizzle) vs columnas reales en PostgreSQL.
 * Uso: DATABASE_URL=... node scripts/audit-schema.mjs
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(__dirname, "../src/db/schema.ts");
const schemaSrc = readFileSync(schemaPath, "utf8");

/** Extrae columnas esperadas por tabla desde pgTable("name", { ... }) */
function parseExpectedColumns() {
  const expected = {};
  const tableRe = /export const \w+ = pgTable\(\s*"([^"]+)"/g;
  let m;
  const blocks = [];
  while ((m = tableRe.exec(schemaSrc)) !== null) {
    const table = m[1];
    const start = m.index;
    const next = schemaSrc.indexOf('export const ', start + 10);
    const block = schemaSrc.slice(start, next === -1 ? undefined : next);
    blocks.push({ table, block });
  }
  for (const { table, block } of blocks) {
    const cols = new Set();
    const colRe = /(?:text|uuid|integer|boolean|jsonb|numeric|timestamp)\(\s*"([^"]+)"/g;
    let c;
    while ((c = colRe.exec(block)) !== null) cols.add(c[1]);
    expected[table] = [...cols].sort();
  }
  return expected;
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL requerida");
  process.exit(1);
}

const sql = postgres(url);
const expected = parseExpectedColumns();

const dbCols = await sql`
  SELECT table_name, column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position`;

const actual = {};
for (const r of dbCols) {
  if (!actual[r.table_name]) actual[r.table_name] = [];
  actual[r.table_name].push(r.column_name);
}

const migs = await sql`SELECT id, hash FROM drizzle.__drizzle_migrations ORDER BY id`;
const journal = JSON.parse(
  readFileSync(join(__dirname, "../drizzle/meta/_journal.json"), "utf8"),
);

const issues = [];
const ok = [];

for (const [table, expCols] of Object.entries(expected)) {
  const act = actual[table] || [];
  const missing = expCols.filter((c) => !act.includes(c));
  const extra = act.filter((c) => !expCols.includes(c));
  if (!actual[table]) {
    issues.push({ type: "missing_table", table, expected: expCols });
  } else if (missing.length || extra.length) {
    issues.push({ type: "column_mismatch", table, missing, extra, inDb: act.length, inSchema: expCols.length });
  } else {
    ok.push(table);
  }
}

const extraTables = Object.keys(actual).filter((t) => !expected[t]);

console.log("=== AUDITORÍA schema.ts vs PostgreSQL ===\n");
console.log(`Migraciones aplicadas: ${migs.length} / ${journal.entries.length} en journal`);
journal.entries.forEach((e, i) => {
  const applied = migs[i]?.hash ? "✓" : "?";
  console.log(`  ${applied} ${e.tag}`);
});

console.log(`\nTablas OK (${ok.length}): ${ok.join(", ")}`);

if (extraTables.length) {
  console.log(`\nTablas en BD sin pgTable en schema: ${extraTables.join(", ") || "(ninguna)"}`);
}

if (issues.length) {
  console.log("\n⚠️  DISCREPANCIAS:");
  for (const i of issues) {
    if (i.type === "missing_table") {
      console.log(`  - Tabla faltante en BD: ${i.table}`);
    } else {
      console.log(`  - ${i.table}:`);
      if (i.missing?.length) console.log(`      Falta en BD: ${i.missing.join(", ")}`);
      if (i.extra?.length) console.log(`      Extra en BD (código no las usa en schema.ts): ${i.extra.join(", ")}`);
    }
  }
} else {
  console.log("\n✅ Todas las tablas del schema coinciden en columnas.");
}

// Auth-critical query smoke test
try {
  await sql`
    SELECT u.id, u.email, u.stripe_customer_id
    FROM users u LIMIT 1`;
  console.log("\n✅ Query users.stripe_customer_id OK");
} catch (e) {
  console.log("\n❌ Query users falló:", e.message);
}

await sql.end();
process.exit(issues.length ? 1 : 0);
