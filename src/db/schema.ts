import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
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

/** Usuarios: columnas Auth.js + negocio (role/plan/status). */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  role: text("role").default("user").notNull(),
  plan: text("plan").default("free").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Cuentas OAuth / email para Auth.js + Drizzle adapter */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    compoundPk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
  }),
);

/** Sesiones de base de datos Auth.js */
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

/** Tokens de verificación (magic link) Auth.js */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (t) => ({
    compoundPk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  favoriteCategories: jsonb("favorite_categories").$type<string[]>().default([]),
  emailDigestFrequency: text("email_digest_frequency").default("weekly").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userFavorites = pgTable(
  "user_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trendId: uuid("trend_id")
      .notNull()
      .references(() => trends.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userTrendUnique: uniqueIndex("user_favorites_user_trend_unique").on(t.userId, t.trendId),
  }),
);

export type Category = typeof categories.$inferSelect;
export type RawTrendItem = typeof rawTrendItems.$inferSelect;
export type Trend = typeof trends.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type UserSessionRow = typeof sessions.$inferSelect;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type UserPreference = typeof userPreferences.$inferSelect;
