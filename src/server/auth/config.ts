import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";
import EmailProvider from "next-auth/providers/email";

import { env } from "~/env";
import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      emailVerified: Date | null;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers:
    env.NODE_ENV === "development"
      ? [
          /**
           * EmailProvider is a custom provider that simulates sending a magic link, but instead
           * logs the link to the console. This is used for development environments to make auth
           * easier to work with.
           */
          EmailProvider({
            from: env.MAILER_ADDRESS,
            server: "someServer",
            sendVerificationRequest: async ({ url }) => {
              console.log("Simulating Email Send");
              console.log("✨✨ Email Auth Magic Link ✨✨\n\n", url, "\n\n");
            },
          }),
        ]
      : [
          /**
           * Production provider uses Resend for reliable email delivery
           */
          Resend({
            from: env.MAILER_ADDRESS,
          }),
        ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  pages: {
    signIn: "/",
  },
  callbacks: {
    session: ({ session, user }) => ({
      // TODO: emailVerified is in this user object, but doesn't appear in any types (other than the one
      // we augmented above). Investigate later.
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
