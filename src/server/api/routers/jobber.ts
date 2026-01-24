import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { authenticationState, jobberAccounts } from "~/server/db/schema/jobber";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { accountData } from "~/lib/jobber/graphql";
import { getJobberAccessToken } from "~/lib/jobber/access-tokens";
import { urls } from "~/lib/jobber/utils";
import { env } from "~/env";

export const jobberRouter = createTRPCRouter({
  getPublicId: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;

    const [account] = await db
      .select({ public_id: jobberAccounts.public_id })
      .from(jobberAccounts)
      .where(eq(jobberAccounts.user_id, user_id));

    return account?.public_id ?? null;
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
    const redirect_uri = `${base_url}/api/jobber-connect/authorize`;

    const queryString = new URLSearchParams({
      response_type: "code",
      client_id,
      redirect_uri,
      state,
    }).toString();

    return `${urls.oauth.authorize}?${queryString}`;
  }),

  getState: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;
    const state = crypto.randomUUID();

    await db.insert(authenticationState).values({
      state,
      user_id,
      valid: true,
    });

    return { state };
  }),

  storeAccountData: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;

    const token = await getJobberAccessToken(user_id);
    if (!token) {
      throw new Error("Failed to get Jobber access token");
    }

    const account = await accountData(user_id, token);

    return account;
  }),

  getAccountData: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;

    const account = await db.query.jobberAccounts.findFirst({
      where: eq(jobberAccounts.user_id, user_id),
    });

    return account ?? null;
  }),
});
