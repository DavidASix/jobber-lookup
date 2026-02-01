import { eq, and, desc } from "drizzle-orm";

import { db } from "~/server/db";
import { jobberTokens, jobberAccounts } from "~/server/db/schema/jobber";
import { env } from "~/env";

import { tokenResponseSchema } from "./types";
import { urls } from "./utils";

/**
 * Updates the connection status for a user's Jobber account.
 * Call this after successful authentication or when token refresh fails.
 *
 * @param user_id - The user ID to update
 * @param status - "connected" or "disconnected"
 */
async function updateConnectionStatus(
  user_id: string,
  status: "connected" | "disconnected",
) {
  await db
    .update(jobberAccounts)
    .set({
      connection_status: status,
      disconnected_at: status === "disconnected" ? new Date() : null,
    })
    .where(eq(jobberAccounts.user_id, user_id));
}

/** Buffer time before expiration to trigger refresh (5 min) */
const EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

/**
 * Checks if a token is expired or about to expire
 */
function isTokenExpired(expiresAt: Date): boolean {
  const bufferTime = new Date(Date.now() + EXPIRATION_BUFFER_MS);
  return expiresAt <= bufferTime;
}

/**
 * Fetches the current token record for a user
 */
async function getTokenRecord(user_id: string) {
  const [tokenRecord] = await db
    .select()
    .from(jobberTokens)
    .where(eq(jobberTokens.user_id, user_id))
    .orderBy(desc(jobberTokens.expires_at))
    .limit(1);
  return tokenRecord;
}

/**
 * Refreshes tokens with Jobber's OAuth endpoint
 */
async function refreshTokensWithJobber(refresh_token: string) {
  const refreshParams = new URLSearchParams({
    client_id: env.NEXT_PUBLIC_JOBBER_CLIENT_ID,
    client_secret: env.JOBBER_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token,
  });

  console.log("Refreshing with token:", refresh_token);

  const response = await fetch(`${urls.oauth.token}?${refreshParams}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data: unknown = await response.json();
  return tokenResponseSchema.parse(data);
}

/**
 * Gets a valid Jobber access token for a user, refreshing only if expired.
 * Uses optimistic locking to prevent race conditions when multiple requests
 * attempt to refresh simultaneously.
 *
 * @param user_id - The user ID to get the token for
 * @returns The access token, or null if unable to get one
 */
export async function getJobberAccessToken(
  user_id: string,
): Promise<string | null> {
  const tokenRecord = await getTokenRecord(user_id);

  if (!tokenRecord) {
    console.error("No token found for user");
    return null;
  }

  // If token is still valid, return it without refreshing
  if (!isTokenExpired(tokenRecord.expires_at)) {
    return tokenRecord.access_token;
  }

  // Token is expired or about to expire, refresh it
  try {
    const newTokens = await refreshTokensWithJobber(tokenRecord.refresh_token);

    // Optimistic lock: only update if refresh_token hasn't changed, this prevents race conditions when multiple requests try to refresh
    const result = await db
      .update(jobberTokens)
      .set({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: new Date(Date.now() + 3600 * 1000),
      })
      .where(
        and(
          eq(jobberTokens.user_id, user_id),
          eq(jobberTokens.refresh_token, tokenRecord.refresh_token),
        ),
      )
      .returning();

    // If no rows updated, another request already refreshed the token, re-fetch and return the current valid token
    if (result.length === 0) {
      const updatedRecord = await getTokenRecord(user_id);
      if (updatedRecord && !isTokenExpired(updatedRecord.expires_at)) {
        return updatedRecord.access_token;
      }
      // Edge case: token was updated but is still expired (shouldn't happen)
      console.error(
        "Token refresh race condition: updated token still expired",
      );
      await updateConnectionStatus(user_id, "disconnected");
      return null;
    }

    // Refresh succeeded - ensure connection status is "connected"
    await updateConnectionStatus(user_id, "connected");

    return newTokens.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // Mark connection as broken so user can be notified
    await updateConnectionStatus(user_id, "disconnected");
    return null;
  }
}
