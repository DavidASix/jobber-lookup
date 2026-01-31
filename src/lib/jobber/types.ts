import { z } from "zod";

export const clientSchema = z.object({
  client: z.object({
    id: z.string(),
    createdAt: z.string(),
    name: z.string().nullable(),
    companyName: z.string().nullable(),
    isCompany: z.boolean(),
  }),
});

const clientsSchema = z.array(clientSchema);

export const invoiceSchema = z.object({
  id: z.string(),
  amounts: z.object({
    total: z.number(),
    invoiceBalance: z.number(),
  }),
  invoiceNumber: z.string(),
  invoiceStatus: z.string(),
  issuedDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  subject: z.string().nullable(),
  clientHubUri: z.string().nullable(),
});

export const invoicesSchema = z.array(invoiceSchema);

export const quoteSchema = z.object({
  id: z.string(),
  amounts: z.object({
    total: z.number(),
  }),
  quoteNumber: z.string(),
  quoteStatus: z.string(),
  message: z.string().nullable(),
  title: z.string().nullable(),
  clientHubUri: z.string().nullable(),
});

export const quotesSchema = z.array(quoteSchema);

// GraphQL response schemas
export const clientEmailsResponseSchema = z.object({
  data: z.object({
    clientEmails: z.object({
      nodes: clientsSchema,
    }),
  }),
});

const accountSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  signupName: z.string().nullable(),
  industry: z.string().nullable(),
  phone: z.string().nullable(),
});

export const accountResponseSchema = z.object({
  data: z.object({
    account: accountSchema,
  }),
});

export const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.string(), // Format: "2024-04-09 21:04:31 UTC"
});

export type Client = z.infer<typeof clientSchema>["client"];
export type Invoice = z.infer<typeof invoiceSchema>;
export type Quote = z.infer<typeof quoteSchema>;
