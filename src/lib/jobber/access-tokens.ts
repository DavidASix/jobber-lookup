import { eq, desc } from "drizzle-orm";

import { db } from "~/server/db";
import { jobberTokens } from "~/server/db/schema/jobber";
import { env } from "~/env";

import { tokenResponseSchema } from "./types";
import { urls } from "./utils";

/**
 * Gets a valid Jobber access token for a user, refreshing if necessary
 *
 * @param user_id - The user ID to get the token for
 * @returns The access token, or null if unable to get one
 */
export async function getJobberAccessToken(
  user_id: string,
): Promise<string | null> {
  // Get the most recent token for this user
  const [tokenRecord] = await db
    .select()
    .from(jobberTokens)
    .where(eq(jobberTokens.user_id, user_id))
    .orderBy(desc(jobberTokens.created_at));

  if (!tokenRecord) {
    console.error("No token found for user");
    return null;
  }

  // Try to refresh the token
  try {
    const refreshParams = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: tokenRecord.refresh_token,
    });

    const response = await fetch(`${urls.oauth}?${refreshParams}`, {
      method: "POST",
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", response.statusText);
      return null;
    }

    const data: unknown = await response.json();
    const { access_token, refresh_token } = tokenResponseSchema.parse(data);

    // Store the new tokens
    await db.insert(jobberTokens).values({
      access_token,
      refresh_token,
      user_id,
    });

    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}
