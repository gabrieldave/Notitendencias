function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.replace(/^"|"$/g, "").trim());
}

export function parseAdminImportCsv(text: string): {
  rows: Record<string, string>[];
  error?: string;
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], error: "CSV vacío o sin datos" };
  }
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const required = ["category", "source_name", "source_url", "title", "raw_text"];
  for (const r of required) {
    if (!header.includes(r)) {
      return { rows: [], error: `Falta columna: ${r}` };
    }
  }
  const idx = (name: string) => header.indexOf(name);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < header.length && cells.every((c) => c === "")) continue;
    const row: Record<string, string> = {};
    for (const col of required) {
      row[col] = cells[idx(col)] ?? "";
    }
    rows.push(row);
  }
  return { rows };
}
