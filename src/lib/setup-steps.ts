import { db } from "~/server/db";
import { setupSteps } from "~/server/db/schema/setup-steps";
import { eq, and } from "drizzle-orm";

/**
 * Updates the user's setup step progress
 */
export async function insertStep(user_id: string, step: number) {
  // Check if a record already exists for this user and step
  const existing = await db.query.setup_step.findFirst({
    where: and(eq(setupSteps.user_id, user_id), eq(setupSteps.step, step)),
  });

  // Only insert if it doesn't exist
  if (!existing) {
    await db.insert(setupSteps).values({
      user_id,
      step,
    });
  }

  return { success: true };
}
