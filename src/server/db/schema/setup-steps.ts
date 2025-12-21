import { integer, pgTable, text, serial } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Table to track the setup steps completed by users.
 */
export const setup_step = pgTable("setup_step", {
  id: serial("id").primaryKey(),
  step: integer("step").notNull(),
  user_id: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});
