"use server";

import { db } from "~/server/db";
import {
  jobberAccounts,
  usageLogs,
  type logTypes,
  type Metadata,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";

/**
 * Logs a user action to the usage_logs table if sufficient identifying information is provided.
 */
export async function logAction({
  jobberAccountId,
  userId,
  logType,
  route,
  metadata,
}: {
  jobberAccountId?: number;
  userId?: string;
  logType: (typeof logTypes)[number];
  route: string;
  metadata?: Metadata;
}) {
  let populatedUserId: string;
  let populatedJobberAccountId: number | undefined;

  if (userId && jobberAccountId) {
    populatedUserId = userId;
    populatedJobberAccountId = jobberAccountId;
  } else if (jobberAccountId) {
    populatedJobberAccountId = jobberAccountId;
    const [account] = await db
      .select({ user_id: jobberAccounts.user_id })
      .from(jobberAccounts)
      .where(eq(jobberAccounts.id, jobberAccountId));
    if (!account) {
      console.error("Jobber account not found for logging.");
      return;
    }
    populatedUserId = account.user_id;
  } else if (userId) {
    populatedUserId = userId;
  } else {
    console.error(
      "Some amount of identifying information required for logging.",
    );
    return;
  }

  await db.insert(usageLogs).values({
    user_id: populatedUserId,
    jobber_account_id: populatedJobberAccountId,
    log_type: logType,
    route,
    metadata,
  });
}
