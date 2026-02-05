import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  integer
} from "drizzle-orm/pg-core";

export const integrationProviderEnum = pgEnum("integration_provider", [
  "google",
  "notion"
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "proposed",
  "approved",
  "failed"
]);

export const notionStatusEnum = pgEnum("notion_status", [
  "skipped",
  "success",
  "failed"
]);

export const notionTargetTypeEnum = pgEnum("notion_target_type", [
  "database",
  "page"
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    userEmailUnique: uniqueIndex("users_email_unique").on(table.email)
  })
);

export const captures = pgTable("captures", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title").notNull(),
  selectedText: text("selected_text").notNull(),
  snippetNullable: text("snippet_nullable"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  captureId: uuid("capture_id")
    .notNull()
    .references(() => captures.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parsedTitle: text("parsed_title").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  locationNullable: text("location_nullable"),
  notesNullable: text("notes_nullable"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  status: proposalStatusEnum("status").default("proposed").notNull(),
  failureReason: text("failure_reason"),
  timezone: text("timezone").notNull().default("UTC")
});

export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: integrationProviderEnum("provider").notNull(),
    encryptedAccessToken: text("encrypted_access_token").notNull(),
    encryptedRefreshToken: text("encrypted_refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    tokenType: text("token_type"),
    scopes: text("scopes").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    integrationUnique: uniqueIndex("integrations_user_provider_unique").on(
      table.userId,
      table.provider
    )
  })
);

export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  proposalId: uuid("proposal_id")
    .notNull()
    .references(() => proposals.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  approvedAt: timestamp("approved_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  gcalEventIdNullable: text("gcal_event_id_nullable"),
  notionPageIdNullable: text("notion_page_id_nullable"),
  rawResponseJson: jsonb("raw_response_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  notionStatus: notionStatusEnum("notion_status").default("skipped").notNull(),
  notionError: text("notion_error")
});

export const extensionTokens = pgTable("extension_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull()
});

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    defaultCalendarId: text("default_calendar_id"),
    defaultDurationMinutes: integer("default_duration_minutes")
      .notNull()
      .default(45),
    notionTargetType: notionTargetTypeEnum("notion_target_type"),
    notionTargetId: text("notion_target_id"),
    defaultSnippetEnabled: boolean("default_snippet_enabled")
      .notNull()
      .default(false),
    timezone: text("timezone").notNull().default("UTC"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
  },
  (table) => ({
    userSettingsUnique: uniqueIndex("user_settings_user_unique").on(table.userId)
  })
);

export type IntegrationProvider = (typeof integrationProviderEnum.enumValues)[number];
export type ProposalStatus = (typeof proposalStatusEnum.enumValues)[number];
export type NotionStatus = (typeof notionStatusEnum.enumValues)[number];
