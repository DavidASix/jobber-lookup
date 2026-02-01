"use client";

import { api } from "~/trpc/react";

export function LookupStatsCard({ accountId }: { accountId?: number }) {
  const { data, status } = api.jobber.getLookupStats.useQuery(
    {
      accountId: accountId!,
    },
    {
      enabled: !!accountId,
    },
  );

  if (!accountId) {
    return (
      <p className="text-muted-foreground text-sm">
        Connect a Jobber account to view lookup statistics.
      </p>
    );
  }

  if (status === "error") {
    return <div>Failed to load stats.</div>;
  }

  if (status === "pending") {
    return <div>Fetching stats...</div>;
  }

  const { apiCalls, emailsSent } = data;
  const successRate = apiCalls ? emailsSent / apiCalls : null;

  return (
    <dl className="grid gap-3">
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <dt className="text-muted-foreground text-xs font-medium">
          Total Requests
        </dt>
        <dd className="text-foreground text-xs">{apiCalls}</dd>
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <dt className="text-muted-foreground text-xs font-medium">
          Successful
        </dt>
        <dd className="text-foreground text-xs">{emailsSent}</dd>
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <dt className="text-muted-foreground text-xs font-medium">Failed</dt>
        <dd className="text-foreground text-xs">{apiCalls - emailsSent}</dd>
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <dt className="text-muted-foreground text-xs font-medium">
          Success Rate
        </dt>
        <dd className="text-foreground text-xs">
          {successRate === null ? "N/A" : `${successRate}%`}
        </dd>
      </div>
    </dl>
  );
}
