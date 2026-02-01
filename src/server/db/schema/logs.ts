import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import z from "zod";

import { users } from "./auth";
import { jobberAccounts } from "./jobber";

export const metadata = z.object({
  requestEmail: z.string().optional(),
  clientId: z.string().optional(),
  invoiceCount: z.number().optional(),
  quoteCount: z.number().optional(),
});

export type Metadata = z.infer<typeof metadata>;

export const logTypes = ["api_call", "email_sent", "no_client_found"] as const;
export const logTypeEnum = pgEnum("log_type", logTypes);

/**
 * Logs for email lookup requests to track usage / success rates
 *
 * Each row represents an action, so a single api call could result in multiple rows.
 * To see the success rate of the email-send route:
 * ```sql
 * select count(*) from usage_logs where log_type = "email_sent" and endpoint route = "send-email"
 * -- divided by
 * select count(*) from usage_logs where log_type = "api_call" and endpoint route = "send-email"
 * ```
 */
export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  jobber_account_id: integer("jobber_account_id").references(
    () => jobberAccounts.id,
    { onDelete: "cascade" },
  ),
  log_type: logTypeEnum("log_type").notNull(),
  route: text("route").notNull(),
  metadata: jsonb("metadata").$type<Metadata>(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});
