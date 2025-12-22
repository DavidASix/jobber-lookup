import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { authenticationState, jobberAccounts } from "~/server/db/schema/jobber";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";

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

  storeAccountData: protectedProcedure.mutation(async () => {
    // Placeholder implementation
    // TODO: Implement actual account data storage logic
    return { success: true, message: "Placeholder - not yet implemented" };
  }),

  getAccountData: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;

    const account = await db.query.jobber_account.findFirst({
      where: eq(jobberAccounts.user_id, user_id),
    });

    return account ?? null;
  }),
});
