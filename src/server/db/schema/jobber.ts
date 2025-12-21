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

export const state_connections = pgTable("state_connections", {
  id: serial("id").primaryKey(),
  valid: boolean("valid").notNull().default(true),
  state: text("state").notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const jobber_tokens = pgTable("jobber_tokens", {
  id: serial("id").primaryKey(),
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token").notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const jobber_account = pgTable("jobber_account", {
  id: serial("id").primaryKey(),
  public_id: uuid("public_id").defaultRandom(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jobber_id: text("jobber_id").notNull(),
  name: text("name"),
  signupName: text("signupName"),
  industry: text("industry"),
  phone: text("phone"),
});

export const stateConnectionsRelations = relations(
  state_connections,
  ({ one }) => ({
    user: one(users, {
      fields: [state_connections.user_id],
      references: [users.id],
    }),
  }),
);

export const jobberTokensRelations = relations(jobber_tokens, ({ one }) => ({
  user: one(users, {
    fields: [jobber_tokens.user_id],
    references: [users.id],
  }),
}));

export const jobberAccountRelations = relations(jobber_account, ({ one }) => ({
  user: one(users, {
    fields: [jobber_account.user_id],
    references: [users.id],
  }),
}));
