import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    google_sub: text("google_sub").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    avatar_url: text("avatar_url"),
    stripe_customer_id: text("stripe_customer_id"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    googleSubIdx: uniqueIndex("users_google_sub_unique").on(table.google_sub)
  })
);

export const googleConnections = pgTable("google_connections", {
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  refresh_token_enc: text("refresh_token_enc").notNull(),
  access_token_enc: text("access_token_enc"),
  expiry: timestamp("expiry", { withTimezone: true }),
  scopes: text("scopes"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const calendars = pgTable(
  "calendars",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").default("google").notNull(),
    calendar_id: text("calendar_id").notNull(),
    name: text("name").notNull(),
    time_zone: text("time_zone"),
    is_default: boolean("is_default").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    calendarUnique: uniqueIndex("calendars_user_calendar_unique").on(
      table.user_id,
      table.calendar_id
    )
  })
);

export const notionConnections = pgTable("notion_connections", {
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  workspace_id: text("workspace_id").notNull(),
  access_token_enc: text("access_token_enc").notNull(),
  bot_id: text("bot_id"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const notionDatabases = pgTable("notion_databases", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  workspace_id: text("workspace_id").notNull(),
  database_id: text("database_id").notNull(),
  name: text("name").notNull(),
  is_default: boolean("is_default").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const entitlements = pgTable("entitlements", {
  user_id: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .primaryKey(),
  plan: text("plan").notNull(),
  max_calendars: integer("max_calendars").notNull(),
  max_notion_workspaces: integer("max_notion_workspaces").notNull(),
  max_notion_dbs: integer("max_notion_dbs").notNull(),
  saves_per_month: integer("saves_per_month"),
  features_json: jsonb("features_json").notNull(),
  stripe_subscription_id: text("stripe_subscription_id"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  deadline_at: timestamp("deadline_at", { withTimezone: true }),
  deadline_tz: text("deadline_tz"),
  deadline_raw: text("deadline_raw"),
  requirements_json: jsonb("requirements_json"),
  deliverables_json: jsonb("deliverables_json"),
  effort_minutes: integer("effort_minutes"),
  block_minutes: integer("block_minutes"),
  summary: text("summary"),
  notes_json: jsonb("notes_json"),
  status: text("status").default("active").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    item_id: uuid("item_id").references(() => items.id, { onDelete: "cascade" }),
    calendar_id: uuid("calendar_id").references(() => calendars.id, {
      onDelete: "cascade"
    }),
    google_event_id: text("google_event_id").notNull(),
    kind: text("kind").notNull(),
    start_at: timestamp("start_at", { withTimezone: true }).notNull(),
    end_at: timestamp("end_at", { withTimezone: true }).notNull()
  },
  (table) => ({
    eventUnique: uniqueIndex("calendar_events_google_unique").on(
      table.google_event_id
    )
  })
);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  metadata_redacted: jsonb("metadata_redacted"),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const usageMonthly = pgTable(
  "usage_monthly",
  {
    user_id: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    yyyymm: integer("yyyymm").notNull(),
    saves_count: integer("saves_count").notNull().default(0)
  },
  (table) => ({
    usageUnique: uniqueIndex("usage_monthly_user_month_unique").on(
      table.user_id,
      table.yyyymm
    )
  })
);

export const extensionTokens = pgTable("extension_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  token_hash: text("token_hash").notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  last_used_at: timestamp("last_used_at", { withTimezone: true }),
  revoked_at: timestamp("revoked_at", { withTimezone: true })
});
