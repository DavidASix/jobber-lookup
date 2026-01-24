import { z } from "zod";
import {
  accountResponseSchema,
  clientEmailsResponseSchema,
  invoicesSchema,
  quotesSchema,
  type Client,
  type Invoice,
  type Quote,
} from "~/types/jobber";
import { db } from "~/server/db";
import { jobberAccounts } from "~/server/db/schema/jobber";

export const urls = {
  graphql: "https://api.getjobber.com/api/graphql",
  oauth: "https://api.getjobber.com/api/oauth/token",
};

/**
 * Functions to interact with Jobber API
 */

/**
 * Construct headers for Jobber GraphQL API requests
 */
function createJobberHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-JOBBER-GRAPHQL-VERSION": "2024-12-05",
  };
}

/**
 * Find a client by email address in Jobber
 * If multiple clients exist, returns the most recently created one
 */
export async function findClientByEmail(
  email: string,
  token: string,
): Promise<Client | null> {
  try {
    const query = `
      query ClientQuery($email: String!) {
        clientEmails(searchTerm: $email) {
          nodes {
            client {
              id
              createdAt
              name
              companyName
              isCompany
            }
          }
        }
      }
    `;

    const response = await fetch(urls.graphql, {
      method: "POST",
      headers: createJobberHeaders(token),
      body: JSON.stringify({
        query,
        variables: { email },
      }),
    });

    if (!response.ok) {
      console.error("Failed to fetch clients:", response.statusText);
      return null;
    }

    const data: unknown = await response.json();
    const result = clientEmailsResponseSchema.parse(data);

    const clients = result.data.clientEmails.nodes;

    if (clients.length === 0) {
      return null;
    }

    // Sort by createdAt and return the most recent
    const sortedClients = clients.sort((a, b) => {
      const dateA = new Date(a.client.createdAt);
      const dateB = new Date(b.client.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const [mostRecentClient] = sortedClients;
    if (!mostRecentClient) {
      return null;
    }

    return mostRecentClient.client;
  } catch (error) {
    console.error("Error in findClientByEmail:", error);
    return null;
  }
}

/**
 * Fetch all invoices for a client from Jobber
 */
export async function fetchInvoices(
  clientId: string,
  token: string,
): Promise<Invoice[]> {
  const invoicesResponseSchema = z.object({
    data: z.object({
      client: z.object({
        invoices: z.object({
          nodes: invoicesSchema,
        }),
      }),
    }),
  });

  const query = `
    query InvoiceQuery($clientId: ID!) {
      client(id: $clientId) {
        invoices {
          nodes {
            id
            amounts {
              total
              invoiceBalance
            }
            invoiceNumber
            invoiceStatus
            issuedDate
            dueDate
            subject
            clientHubUri
          }
        }
      }
    }
  `;

  const response = await fetch(urls.graphql, {
    method: "POST",
    headers: createJobberHeaders(token),
    body: JSON.stringify({
      query,
      variables: { clientId },
    }),
  });

  if (!response.ok) {
    console.error("Failed to fetch invoices:", response.statusText);
    return [];
  }

  const data: unknown = await response.json();
  const result = invoicesResponseSchema.parse(data);

  return result.data.client.invoices.nodes;
}

/**
 * Fetch all quotes for a client from Jobber
 */
export async function fetchQuotes(
  clientId: string,
  token: string,
): Promise<Quote[]> {
  const quotesResponseSchema = z.object({
    data: z.object({
      client: z.object({
        quotes: z.object({
          nodes: quotesSchema,
        }),
      }),
    }),
  });

  const query = `
    query QuoteQuery($clientId: ID!) {
      client(id: $clientId) {
        quotes {
          nodes {
            id
            amounts {
              total
            }
            quoteNumber
            quoteStatus
            message
            title
            clientHubUri
          }
        }
      }
    }
  `;

  const response = await fetch(urls.graphql, {
    method: "POST",
    headers: createJobberHeaders(token),
    body: JSON.stringify({
      query,
      variables: { clientId },
    }),
  });

  if (!response.ok) {
    console.error("Failed to fetch quotes:", response.statusText);
    return [];
  }

  const data: unknown = await response.json();
  const result = quotesResponseSchema.parse(data);

  return result.data.client.quotes.nodes;
}

/**
 * Fetch account data from Jobber and save it to the database
 */
export async function accountData(
  userId: string,
  token: string,
): Promise<{
  id: number;
  public_id: string;
  user_id: string;
  jobber_id: string;
  name: string | null;
  signup_name: string | null;
  industry: string | null;
  phone: string | null;
}> {
  const query = `
    query AccountQuery {
      account {
        id
        name
        signupName
        industry
        phone
      }
    }
  `;

  const response = await fetch(urls.graphql, {
    method: "POST",
    headers: createJobberHeaders(token),
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch account data: ${response.statusText}`);
  }

  const data: unknown = await response.json();
  const result = accountResponseSchema.parse(data);

  const account = result.data.account;

  // Handle "Empty" signupName
  let signup_name = account.signupName;
  signup_name = signup_name === "Empty" ? null : signup_name;

  // Insert or update account data in database TODO: This should not update on public_id conflict, it should probably fail as the public id has already been claimed
  const [accountRecord] = await db
    .insert(jobberAccounts)
    .values({
      user_id: userId,
      jobber_id: account.id,
      name: account.name,
      signup_name,
      industry: account.industry,
      phone: account.phone,
    })
    .onConflictDoUpdate({
      target: jobberAccounts.public_id,
      set: {
        jobber_id: account.id,
        name: account.name,
        signup_name,
        industry: account.industry,
        phone: account.phone,
      },
    })
    .returning();

  if (!accountRecord) {
    throw new Error("Failed to save account data to database");
  }

  return accountRecord;
}
