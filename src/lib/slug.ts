import { createHash } from "crypto";

function normalize(s: string): string {
  const base = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 80);
}

export function slugifyTitle(title: string): string {
  const base = normalize(title) || "tendencia";
  const suffix = createHash("sha256")
    .update(title + Date.now().toString())
    .digest("hex")
    .slice(0, 8);
  return `${base}-${suffix}`;
}
