import "dotenv/config";
import { db } from "./index";
import { categories, sources } from "./schema";
import { eq } from "drizzle-orm";

const categorySeeds = [
  { slug: "ia", name: "IA", description: "Inteligencia artificial y agentes" },
  {
    slug: "tecnologia",
    name: "Tecnología",
    description: "Innovación y herramientas digitales",
  },
  { slug: "dinero", name: "Dinero", description: "Finanzas y economía digital" },
  {
    slug: "creadores",
    name: "Creadores",
    description: "Contenido, redes y audiencias",
  },
  {
    slug: "entretenimiento",
    name: "Entretenimiento",
    description: "Cultura digital y tendencias de consumo",
  },
  {
    slug: "negocios",
    name: "Negocios",
    description: "Emprendimiento y modelos de negocio",
  },
];

const sourceSeeds = [
  { name: "Kimi WebBridge", type: "bridge", url: null as string | null },
  { name: "Hacker News", type: "aggregator", url: "https://news.ycombinator.com" },
  { name: "X", type: "social", url: "https://x.com" },
  { name: "Reddit", type: "social", url: "https://reddit.com" },
  { name: "Google Trends", type: "signals", url: "https://trends.google.com" },
  { name: "Product Hunt", type: "aggregator", url: "https://www.producthunt.com" },
  { name: "Blog Oficial", type: "blog", url: null },
];

async function main() {
  for (const c of categorySeeds) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, c.slug))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(categories).values(c);
      console.log("Categoría creada:", c.slug);
    }
  }

  for (const s of sourceSeeds) {
    const existing = await db
      .select()
      .from(sources)
      .where(eq(sources.name, s.name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(sources).values(s);
      console.log("Fuente creada:", s.name);
    }
  }

  console.log("Seed completado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
