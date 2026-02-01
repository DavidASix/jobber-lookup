import z from "zod";
import { eq, and, count } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { authenticationState, jobberAccounts } from "~/server/db/schema/jobber";
import { usageLogs } from "~/server/db/schema/logs";
import { db } from "~/server/db";
import { urls } from "~/lib/jobber/utils";
import { env } from "~/env";

export const jobberRouter = createTRPCRouter({
  /**
   * Fetches the Jobber account data associated with the current user from the database, does not call Jobber API.
   */
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

  /**
   * Fetches lookup email statistics for the current user's Jobber account.
   */
  getLookupStats: protectedProcedure
    .input(z.object({ accountId: z.number() }))
    .query(async ({ ctx, input }) => {
      const { id: user_id } = ctx.session.user;
      const { accountId } = input;
      const [apiCalls] = await db
        .select({
          count: count(),
        })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.user_id, user_id),
            eq(usageLogs.jobber_account_id, accountId),
            eq(usageLogs.log_type, "api_call"),
            eq(usageLogs.route, "send-lookup-email"),
          ),
        )
        .groupBy(usageLogs.jobber_account_id);
      const [emailsSent] = await db
        .select({
          count: count(),
        })
        .from(usageLogs)
        .where(
          and(
            eq(usageLogs.user_id, user_id),
            eq(usageLogs.jobber_account_id, accountId),
            eq(usageLogs.log_type, "email_sent"),
            eq(usageLogs.route, "send-lookup-email"),
          ),
        )
        .groupBy(usageLogs.jobber_account_id);

      return {
        apiCalls: apiCalls?.count ?? 0,
        emailsSent: emailsSent?.count ?? 0,
      };
    }),

  /**
   * Public endpoint that fetches all set-up Jobber account's statuses.
   */
  getAccountStatuses: publicProcedure.query(async () => {
    const accounts = await db
      .select({
        name: jobberAccounts.name,
        public_id: jobberAccounts.public_id,
        connection_status: jobberAccounts.connection_status,
        disconnected_at: jobberAccounts.disconnected_at,
      })
      .from(jobberAccounts);

    return accounts;
  }),
});
