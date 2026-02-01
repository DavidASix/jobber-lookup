import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { env } from "~/env";
import { db } from "~/server/db";
import { jobberAccounts } from "~/server/db/schema/jobber";
import { getJobberAccessToken } from "~/lib/jobber/access-tokens";
import {
  findClientByEmail,
  fetchInvoices,
  fetchQuotes,
} from "~/lib/jobber/graphql";
import { LookupEmail } from "~/lib/emails/lookup-email";
import { logAction } from "~/lib/logs";

const emailLookupSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Email lookup endpoint for sending client invoices and quotes
 *
 * This is a public CORS-enabled endpoint that:
 * 1. Looks up a Jobber account by public_id
 * 2. Searches for a client by email in that account
 * 3. Fetches their invoices and quotes from Jobber
 * 4. Sends an email with the results
 *
 * @param request - Contains query params: id (account public_id) and email (client email)
 * @returns JSON response indicating success or failure with CORS headers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { id, email } = emailLookupSchema.parse(searchParams);

    // Look up the jobber account
    const [account] = await db
      .select()
      .from(jobberAccounts)
      .where(eq(jobberAccounts.public_id, id));

    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    await logAction({
      jobberAccountId: account.id,
      userId: account.user_id,
      logType: "api_call",
      route: "send-lookup-email",
      metadata: {
        requestEmail: email,
      },
    });

    // Get a refreshed access token
    const token = await getJobberAccessToken(account.user_id);
    if (!token) {
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    // Get client by email
    const client = await findClientByEmail(email, token);
    if (!client) {
      await logAction({
        jobberAccountId: account.id,
        userId: account.user_id,
        logType: "no_client_found",
        route: "send-lookup-email",
        metadata: {
          requestEmail: email,
        },
      });
      return NextResponse.json(
        { success: false, message: "Client's email could not be found in Jobber." },
        { headers: CORS_HEADERS },
      );
    }

    // Fetch invoices and quotes concurrently
    const [invoices, quotes] = await Promise.all([
      fetchInvoices(client.id, token),
      fetchQuotes(client.id, token),
    ]);

    await logAction({
      jobberAccountId: account.id,
      userId: account.user_id,
      logType: "email_sent",
      route: "send-lookup-email",
      metadata: {
        clientId: client.id,
        requestEmail: email,
        invoiceCount: invoices.length,
        quoteCount: quotes.length,
      },
    });

    const resend = new Resend(env.RESEND_API_KEY);

    const mailerAddress = env.MAILER_ADDRESS;

    const lookupEmail = await LookupEmail({
      businessName: account.name ?? "",
      client,
      invoices,
      quotes,
    });

    const { error } = await resend.emails.send({
      from: `Jobber.Tools <${mailerAddress}>`,
      to: [email],
      subject: `Your ${account.name ? `${account.name} ` : ""}quotes & invoices`,
      react: lookupEmail,
    });

    if (error) {
      return NextResponse.json(
        { error: "Could not send email" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { success: true, message: "Email sent" },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("Send invoices error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
