import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { state_connections, jobber_tokens } from "~/server/db/schema/jobber";
import { insertStep } from "~/lib/setup-steps";
import { env } from "~/env";

const authorizeSchema = z.object({
  code: z.string(),
  state: z.string(),
});

const oauthTokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
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
      .from(state_connections)
      .where(
        and(
          eq(state_connections.state, state),
          eq(state_connections.valid, true),
          sql`${state_connections.created_at} > NOW() - INTERVAL '1 hour'`,
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
    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/authorize-jobber`;

    // Prepare token exchange request
    const authParams = new URLSearchParams({
      client_id: env.JOBBER_CLIENT_ID,
      client_secret: env.JOBBER_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
    }).toString();

    const authUrl = `https://api.getjobber.com/api/oauth/token?${authParams}`;

    // Exchange authorization code for access token
    const oauthRequest = await fetch(authUrl, { method: "POST" });
    const oauthResponse: unknown = await oauthRequest.json();
    const oauthData = oauthTokenSchema.parse(oauthResponse);

    // Mark the state as used
    await db
      .update(state_connections)
      .set({ valid: false })
      .where(eq(state_connections.id, stateInDb.id));

    // Insert tokens into database
    const user_id = stateInDb.user_id;
    await db.insert(jobber_tokens).values({
      access_token: oauthData.access_token,
      refresh_token: oauthData.refresh_token,
      user_id: user_id,
    });

    console.log("OAuth tokens inserted into database");

    // Update user's setup progress to step 3
    await insertStep(user_id, 3);
  } catch (error) {
    console.error("OAuth authorization error:", error);
  } finally {
    // Always redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }
}
