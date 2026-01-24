"use client";

import type { User } from "next-auth";
import { api } from "~/trpc/react";
import { LoadingState } from "../_components/loading-state";
import { Button } from "~/components/ui/button";
import { useState } from "react";

// TODO: Handle ("/?error=oauth_failed")

export function Dashboard({ user }: { user: User }) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const { data: accountData, status: accountDataStatus } =
    api.jobber.getAccountData.useQuery();

  const { data: authUrl, status: authUrlStatus } =
    api.jobber.getPublicAuthorizationUrl.useQuery(undefined, {
      enabled: accountData === null && !isAuthorizing,
    });

  const handleAuthorize = async () => {
    if (isAuthorizing) return;
    if (!authUrl) {
      // TODO: toast and give escape hatch
    }
    setIsAuthorizing(true);
    // TODO: Probably we want to just "kill" this tab asking the user to refresh or close it after they click auth
    window.open(authUrl, "_blank");
  };

  if (accountDataStatus === "error" || authUrlStatus === "error") {
    return <p>Error loading data. Please try again later.</p>;
  }

  if (accountDataStatus === "pending") {
    return <LoadingState />;
  }

  if (accountData === null) {
    return (
      <>
        <p>No Jobber account linked.</p>
        <Button
          size="lg"
          onClick={handleAuthorize}
          disabled={!authUrl || isAuthorizing}
        >
          Link your Jobber Account
        </Button>
      </>
    );
  }

  // User has linked their Jobber account
  return (
    <>
      <p>{JSON.stringify(user)}</p>
      <p>{JSON.stringify(accountData)}</p>
    </>
  );
}
