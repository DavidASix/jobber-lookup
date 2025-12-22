import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { setupSteps, jobberAccounts } from "~/server/db/schema";

export const accountRouter = createTRPCRouter({
  getCurrentStep: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;

    const [stepRecord] = await db
      .select()
      .from(setupSteps)
      .where(eq(setupSteps.user_id, user_id));

    return stepRecord?.step ?? null;
  }),

  setStep: protectedProcedure
    .input(z.object({ step: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const { id: user_id } = ctx.session.user;
      const { step } = input;

      const [existingStep] = await db
        .select()
        .from(setupSteps)
        .where(eq(setupSteps.user_id, user_id));

      if (existingStep) {
        const [updated] = await db
          .update(setupSteps)
          .set({ step })
          .where(eq(setupSteps.user_id, user_id))
          .returning();
        return updated;
      } else {
        const [created] = await db
          .insert(setupSteps)
          .values({ user_id, step })
          .returning();
        return created;
      }
    }),

  getPublicId: protectedProcedure.query(async ({ ctx }) => {
    const { id: user_id } = ctx.session.user;

    const [account] = await db
      .select({ public_id: jobberAccounts.public_id })
      .from(jobberAccounts)
      .where(eq(jobberAccounts.user_id, user_id));

    return account?.public_id ?? null;
  }),
});
