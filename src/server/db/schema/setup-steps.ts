import { integer, pgTable, text, serial } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Table to track the setup steps completed by users.
 */
export const setupSteps = pgTable("setup_steps", {
  id: serial("id").primaryKey(),
  step: integer("step").notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});
