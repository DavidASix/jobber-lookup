import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { authenticationState, jobberAccounts } from "~/server/db/schema/jobber";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { urls } from "~/lib/jobber/utils";
import { env } from "~/env";

export const jobberRouter = createTRPCRouter({
  getAccountData: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;

    const [account] = await db
      .select()
      .from(jobberAccounts)
      .where(eq(jobberAccounts.user_id, user_id));

    return account ?? null;
  }),

  /**
   * Stores a new random state associated with the current user and returns the full Jobber OAuth authorization URL.
   */
  getPublicAuthorizationUrl: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;
    const state = crypto.randomUUID();
    await db.insert(authenticationState).values({
      state,
      user_id,
      valid: true,
    });
    const client_id = env.NEXT_PUBLIC_JOBBER_CLIENT_ID;
    const base_url = env.NEXT_PUBLIC_PROJECT_URL;
    const redirect_uri = `${base_url}/api/authorize-jobber`;

    const queryString = new URLSearchParams({
      response_type: "code",
      client_id,
      redirect_uri,
      state,
    }).toString();

    return `${urls.oauth.authorize}?${queryString}`;
  }),
});
