import { relations } from "drizzle-orm";
import {
  boolean,
  timestamp,
  pgTable,
  text,
  serial,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const authenticationState = pgTable("authentication_state", {
  id: serial("id").primaryKey(),
  valid: boolean("valid").notNull().default(true),
  state: text("state").notNull().unique(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const jobberTokens = pgTable("jobber_tokens", {
  id: serial("id").primaryKey(),
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token").notNull().unique(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const jobberAccounts = pgTable("jobber_accounts", {
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
});

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
