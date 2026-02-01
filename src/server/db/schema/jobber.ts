import { relations } from "drizzle-orm";
import {
  boolean,
  timestamp,
  pgTable,
  text,
  serial,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Stores OAuth authentication states to validate the OAuth flow and associate it with a user.
 *
 * Each state is a unique string tied to a user and marked as valid or invalid. The state is used to ensure the
 * correct callback from Jobber corresponds to the initiated OAuth request. Once used, the state should be marked invalid to prevent reuse.
 */
export const authenticationState = pgTable("authentication_state", {
  id: serial("id").primaryKey(),
  valid: boolean("valid").notNull().default(true),
  state: text("state").notNull().unique(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Stores Jobber OAuth access and refresh tokens which are used to make authorized API requests on behalf of the user.
 */
export const jobberTokens = pgTable("jobber_tokens", {
  id: serial("id").primaryKey(),
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull().defaultNow(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Connection status for Jobber accounts.
 * - connected: OAuth tokens are valid and working
 * - disconnected: Token refresh failed, user needs to re-authorize
 */
export type JobberConnectionStatus = "connected" | "disconnected";

/**
 * Fact table storing Jobber account information associated with each user.
 *
 * @note that multiple users can have the same jobber account; and a single user can have multiple jobber accounts.
 */
export const jobberAccounts = pgTable(
  "jobber_accounts",
  {
    id: serial("id").primaryKey(),
    public_id: uuid("public_id").defaultRandom().unique().notNull(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobber_id: text("jobber_id").notNull(),
    name: text("name"),
    signup_name: text("signup_name"),
    industry: text("industry"),
    phone: text("phone"),
    connection_status: text("connection_status")
      .$type<JobberConnectionStatus>()
      .notNull()
      .default("disconnected"),
    disconnected_at: timestamp("disconnected_at"),
  },
  (table) => [unique().on(table.user_id, table.jobber_id)],
);

export const authenticationStateRelations = relations(
  authenticationState,
  ({ one }) => ({
    user: one(users, {
      fields: [authenticationState.user_id],
      references: [users.id],
    }),
  }),
);

export const jobberTokensRelations = relations(jobberTokens, ({ one }) => ({
  user: one(users, {
    fields: [jobberTokens.user_id],
    references: [users.id],
  }),
}));

export const jobberAccountRelations = relations(jobberAccounts, ({ one }) => ({
  user: one(users, {
    fields: [jobberAccounts.user_id],
    references: [users.id],
  }),
}));
