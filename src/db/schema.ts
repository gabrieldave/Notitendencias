import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rawTrendItems = pgTable("raw_trend_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  categorySlug: text("category_slug").notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url"),
  title: text("title").notNull(),
  rawText: text("raw_text"),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
  status: text("status").default("new").notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const trends = pgTable("trends", {
  id: uuid("id").defaultRandom().primaryKey(),
  rawItemId: uuid("raw_item_id").references(() => rawTrendItems.id),
  categorySlug: text("category_slug").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  whyItMatters: text("why_it_matters"),
  opportunity: text("opportunity"),
  contentIdeas: jsonb("content_ideas").$type<string[]>().default([]),
  businessIdeas: jsonb("business_ideas").$type<string[]>().default([]),
  tags: jsonb("tags").$type<string[]>().default([]),
  trendScore: integer("trend_score").default(0).notNull(),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  status: text("status").default("draft").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status").default("active").notNull(),
  plan: text("plan").default("free").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const newsletterSends = pgTable("newsletter_sends", {
  id: uuid("id").defaultRandom().primaryKey(),
  subscriberId: uuid("subscriber_id").references(() => subscribers.id),
  subject: text("subject"),
  status: text("status").default("pending").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const appEvents = pgTable("app_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: text("type").notNull(),
  payloadJson: jsonb("payload_json").$type<Record<string, unknown>>(),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Category = typeof categories.$inferSelect;
export type RawTrendItem = typeof rawTrendItems.$inferSelect;
export type Trend = typeof trends.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
