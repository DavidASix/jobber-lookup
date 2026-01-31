import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { authenticationState, jobberTokens } from "~/server/db/schema/jobber";
import { env } from "~/env";
import { urls } from "~/lib/jobber/utils";
import { fetchAndStoreAccountData } from "~/lib/jobber/graphql";
import { getJobberAccessToken } from "~/lib/jobber/access-tokens";
import { tokenResponseSchema } from "~/lib/jobber/types";

const authorizeSchema = z.object({
  code: z.string(),
  state: z.string(),
});

/**
 * OAuth callback endpoint for Jobber authorization
 *
 * This endpoint handles the OAuth 2.0 authorization code flow callback from Jobber. This is the callback endpoint that
 * jobber redirects to after the user authorizes the application.
 *
 * It validates the state parameter, exchanges the authorization code jobber provided for access/refresh tokens,
 * stores the tokens in the database, and updates the user's setup progress.
 *
 * @param request - Next.js request object containing code and state query parameters
 * @returns Redirects to home page after processing (success or failure)
 *
 * @throws Will log errors but always redirect to home to prevent user from being stuck
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { code, state } = authorizeSchema.parse(searchParams);

    // Check if state is valid and not expired (1 hour window)
    const [stateInDb] = await db
      .select()
      .from(authenticationState)
      .where(
        and(
          eq(authenticationState.state, state),
          eq(authenticationState.valid, true),
          sql`${authenticationState.created_at} > NOW() - INTERVAL '1 hour'`,
        ),
      );

    if (!stateInDb) {
      console.error("State not found in database, or expired");
      return NextResponse.json(
        { error: "Authorization failed" },
        { status: 404 },
      );
    }

    // Construct redirect URI from the request

    const redirectUri = `${env.NEXT_PUBLIC_PROJECT_URL}/api/authorize-jobber`;

    // Prepare token exchange request
    const authParams = new URLSearchParams({
      client_id: env.NEXT_PUBLIC_JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }).toString();

    const authUrl = `${urls.oauth.token}?${authParams}`;

    // Exchange authorization code for access token
    const oauthRequest = await fetch(authUrl, { method: "POST" });

    if (!oauthRequest.ok) {
      const errorText = await oauthRequest.text();
      console.error(
        `Jobber OAuth token exchange failed with status ${oauthRequest.status}:`,
        errorText,
      );
      return NextResponse.redirect(
        // TODO: It'd be nice to centralize this error URL construction somewhere to have better handling of the displayed response message, and logging
        new URL("/?error=oauth_failed", request.url),
      );
    }

    const oauthResponse: unknown = await oauthRequest.json();
    const parseResult = tokenResponseSchema.safeParse(oauthResponse);

    if (!parseResult.success) {
      console.error(
        "Invalid OAuth response from Jobber:",
        parseResult.error.errors,
      );
      return NextResponse.redirect(
        new URL("/?error=invalid_response", request.url),
      );
    }

    const oauthData = parseResult.data;
    let expiresAt: Date = new Date(oauthData.expires_at);
    if (isNaN(expiresAt.getTime())) {
      // Fallback: if expires_at is not a valid date, set it to 1 hour from now
      expiresAt = new Date(Date.now() + 3600 * 1000);
    }

    // Mark the state as used
    await db
      .update(authenticationState)
      .set({ valid: false })
      .where(eq(authenticationState.id, stateInDb.id));

    // Insert tokens into database
    const user_id = stateInDb.user_id;
    await db.insert(jobberTokens).values({
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      expires_at: expiresAt,
      user_id: user_id,
    });

    console.log("OAuth tokens inserted into database");

    let token: string;
    try {
      const queriedToken = await getJobberAccessToken(user_id);
      if (!queriedToken) {
        throw new Error("Failed to retrieve access token after OAuth flow");
      }
      token = queriedToken;
    } catch {
      console.log("Failed to get access token for user after OAuth flow", {
        user_id,
      });
      return NextResponse.redirect(
        new URL("/?error=missing_token", request.url),
      );
    }

    try {
      // Fetch and store the account data, but do nothing with the return
      await fetchAndStoreAccountData(user_id, token);
      // Success - redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    } catch {
      console.error("Failed to fetch/store account data after OAuth flow", {
        user_id,
      });
      return NextResponse.redirect(
        new URL("/?error=data_fetch_fail", request.url),
      );
    }
  } catch (error) {
    console.error("OAuth authorization error:", error);
    // Redirect with error parameter for user feedback
    return NextResponse.redirect(
      new URL("/?error=authorization_error", request.url),
    );
  }
}
