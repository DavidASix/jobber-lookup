import { eq, desc } from "drizzle-orm";

import { db } from "~/server/db";
import { jobberTokens } from "~/server/db/schema/jobber";
import { env } from "~/env";

import { tokenResponseSchema } from "./types";
import { urls } from "./utils";

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
 * Gets a valid Jobber access token for a user, refreshing only if expired
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
    .orderBy(desc(jobberTokens.created_at))
    .limit(1);

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
    const refreshParams = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: tokenRecord.refresh_token,
    });

    const response = await fetch(`${urls.oauth.token}?${refreshParams}`, {
      method: "POST",
    });

    if (!response.ok) {
      console.error("Failed to refresh token:", response.statusText);
      return null;
    }

    const data: unknown = await response.json();
    const { access_token, refresh_token, expires_at } =
      tokenResponseSchema.parse(data);

    // Store the new tokens
    await db.insert(jobberTokens).values({
      access_token,
      refresh_token,
      expires_at: new Date(expires_at),
      user_id,
    });

    return access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}
