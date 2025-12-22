import * as React from "react";
import { type z } from "zod";
import {
  type clientSchema,
  type invoicesSchema,
  type quotesSchema,
} from "~/types/jobber";

const quoteStatusMap: Record<
  z.infer<typeof quotesSchema>[number]["quoteStatus"],
  { text: string; color: string }
> = {
  draft: { text: "Draft", color: "#1c1c1c" },
  awaiting_response: { text: "Sent", color: "#1c1c1c" },
  archived: { text: "Archived", color: "#1c1c1c" },
  approved: { text: "Approved", color: "#48bb78" },
  converted: { text: "Job Created", color: "#1c1c1c" },
  changes_requested: { text: "Changes Pending", color: "#514502" },
};

const invoiceStatusMap: Record<
  z.infer<typeof invoicesSchema>[number]["invoiceStatus"],
  { text: string; color: string }
> = {
  draft: { text: "Draft", color: "#1c1c1c" },
  awaiting_payment: { text: "Awaiting Payment", color: "#514502" },
  paid: { text: "Paid", color: "#48bb78" },
  past_due: { text: "Due", color: "#3f1616" },
  bad_debt: { text: "Due", color: "#3f1616" },
  sent_not_due: { text: "Sent, Not Due", color: "#1c1c1c" },
};

interface LookupEmail {
  businessName: string;
  client: z.infer<typeof clientSchema>["client"];
  invoices: z.infer<typeof invoicesSchema>;
  quotes: z.infer<typeof quotesSchema>;
}

export const LookupEmail: React.FC<Readonly<LookupEmail>> = ({
  businessName,
  client,
  invoices,
  quotes,
}) => {
  const disabledInvoiceStatuses = ["draft"];
  const filteredInvoices = invoices.filter(
    (invoice) => !disabledInvoiceStatuses.includes(invoice.invoiceStatus),
  );
  const disabledQuoteStatuses = ["draft"];
  const filteredQuotes = quotes.filter(
    (quote) => !disabledQuoteStatuses.includes(quote.quoteStatus),
  );
  return (
    <div>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <h1>Your {businessName ? `${businessName} ` : ""}quotes & invoices</h1>
        <p style={{ fontSize: "16px", color: "#666" }}>
          Hello {client.isCompany ? client.companyName : client.name},
        </p>

        <p
          style={{
            fontSize: "16px",
            lineHeight: "1.5",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Here is a summary of your quotes and invoices:
        </p>

        {filteredQuotes.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                color: "#415b2e",
                fontSize: "20px",
                marginBottom: "15px",
              }}
            >
              Quotes
            </h2>
            {filteredQuotes.map((quote) => {
              const quoteDetails =
                quoteStatusMap[quote.quoteStatus] ?? quoteStatusMap.draft!;

              return (
                <div
                  key={quote.id}
                  style={{
                    padding: "15px",
                    marginBottom: "15px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px 0", color: "#2d3748" }}>
                    {quote.title ?? "Quote"} # {quote.quoteNumber}
                  </h3>
                  <p style={{ margin: "5px 0", color: "#4a5568" }}>
                    Status:{" "}
                    <span
                      style={{
                        color: quoteDetails.color,
                      }}
                    >
                      {quoteDetails.text}
                    </span>
                  </p>
                  <p style={{ margin: "5px 0", color: "#4a5568" }}>
                    Amount: ${Number(quote.amounts.total).toFixed(2)}
                  </p>
                  <a
                    href={quote.clientHubUri ?? ""}
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                      padding: "8px 16px",
                      backgroundColor: "#a4d643",
                      color: "black",
                      textDecoration: "none",
                      borderRadius: "4px",
                    }}
                  >
                    View Quote
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {filteredInvoices.length > 0 && (
          <div style={{ marginBottom: "40px" }}>
            <h2
              style={{
                color: "#415b2e",
                fontSize: "20px",
                marginBottom: "15px",
              }}
            >
              Invoices
            </h2>
            {filteredInvoices.map((invoice) => {
              const invoiceDetails =
                invoiceStatusMap[invoice.invoiceStatus] ??
                invoiceStatusMap.draft!;
              return (
                <div
                  key={invoice.id}
                  style={{
                    padding: "15px",
                    marginBottom: "15px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <h3 style={{ margin: "0 0 10px 0", color: "#2d3748" }}>
                    Invoice #{invoice.invoiceNumber}
                  </h3>
                  <p style={{ margin: "5px 0", color: "#4a5568" }}>
                    Status:{" "}
                    <span
                      style={{
                        color: invoiceDetails.color,
                      }}
                    >
                      {invoiceDetails.text}
                    </span>
                  </p>
                  <p style={{ margin: "5px 0", color: "#4a5568" }}>
                    Total: ${Number(invoice.amounts.total).toFixed(2)}
                  </p>
                  {Number(invoice.amounts.invoiceBalance) > 0 && (
                    <p style={{ margin: "5px 0", color: "#4a5568" }}>
                      Balance Due: $
                      {Number(invoice.amounts.invoiceBalance).toFixed(2)}
                    </p>
                  )}
                  <p style={{ margin: "5px 0", color: "#4a5568" }}>
                    Due Date:{" "}
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString()
                      : ""}
                  </p>
                  <a
                    href={invoice.clientHubUri ?? ""}
                    style={{
                      display: "inline-block",
                      marginTop: "10px",
                      padding: "8px 16px",
                      backgroundColor: "#a4d643",
                      color: "black",
                      textDecoration: "none",
                      borderRadius: "4px",
                    }}
                  >
                    View Invoice
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {quotes.length === 0 && invoices.length === 0 && (
          <p style={{ fontSize: "16px", color: "#666", fontStyle: "italic" }}>
            No quotes or invoices found.
          </p>
        )}

        <p
          style={{
            fontSize: "14px",
            color: "#888",
            marginTop: "40px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "20px",
          }}
        >
          This email was sent automatically from {businessName}. Please do not
          reply to this email.
        </p>
      </div>
    </div>
  );
};
