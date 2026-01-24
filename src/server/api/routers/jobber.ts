import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { authenticationState, jobberAccounts } from "~/server/db/schema/jobber";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { accountData } from "~/lib/jobber/graphql";
import { getJobberAccessToken } from "~/lib/jobber/access-tokens";

export const jobberRouter = createTRPCRouter({
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
