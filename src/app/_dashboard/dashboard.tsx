"use client";

import type { User } from "next-auth";
import { api } from "~/trpc/react";
import { LoadingState } from "../_components/loading-state";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SendEmailForm } from "./send-email-form";
import { IntegrationTutorial } from "./integration-tutorial";
import { toast } from "sonner";

// TODO: add a danger button to clear all connected jobber accounts, and push user to jobber to do the same

const errorParamDetails: Record<string, string> = {
  oauth_failed:
    "Error linking Jobber account. Please refresh the page and try again later.",
  missing_token:
    "Failed to retrieve access token. Please contact your developer.",
  invalid_response:
    "Received invalid response from Jobber. Please contact your developer.",
  data_fetch_fail:
    "Failed to fetch account data. Please refresh and try again later.",
};

const defaultError =
  "An error has occurred, pleased refresh and try again later.";

export function Dashboard({ user }: { user: User }) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const { data: accountData, status: accountDataStatus } =
    api.jobber.getAccountData.useQuery();

  const { data: authUrl, status: authUrlStatus } =
    api.jobber.getPublicAuthorizationUrl.useQuery(undefined, {
      enabled: accountData === null && !isAuthorizing,
    });

  const handleAuthorize = async () => {
    if (isAuthorizing) return;
    if (!authUrl) {
      toast.error(
        "Authorization URL not available. Please refresh and try again.",
      );
      return;
    }
    setIsAuthorizing(true);
    window.open(authUrl, "_blank");
  };

  if (isAuthorizing) {
    return (
      <p>Redirecting to Jobber for authorization. You can close this page.</p>
    );
  }

  if (errorParam) {
    return <p>{errorParamDetails[errorParam] ?? defaultError}</p>;
  }

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
        <Button size="lg" onClick={handleAuthorize} disabled={!authUrl}>
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
      <SendEmailForm public_id={accountData.public_id} />
      <IntegrationTutorial public_id={accountData.public_id} />
    </>
  );
}
