"use client";

import type { Session } from "next-auth";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

import { LoadingState } from "../_components/loading-state";
import { SendEmailForm } from "./send-email-form";
import { IntegrationTutorial } from "./integration-tutorial";

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
  "An error has occurred, please refresh and try again later.";

export function Dashboard({ user }: { user: Session["user"] }) {
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
    return (
      <Alert variant="destructive" className="mx-auto max-w-100">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {errorParamDetails[errorParam] ?? defaultError}
        </AlertDescription>
      </Alert>
    );
  }

  if (accountDataStatus === "error" || authUrlStatus === "error") {
    return (
      <Alert variant="destructive" className="mx-auto max-w-100">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Error loading data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (accountDataStatus === "pending") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (accountData === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Jobber Account</CardTitle>
            <CardDescription>
              Link your Jobber account to start using the invoice lookup tool
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button
              size="lg"
              onClick={handleAuthorize}
              disabled={!authUrl}
              className="w-full"
            >
              Link your Jobber Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has linked their Jobber account
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="text-muted-foreground text-xs font-medium">
                Email
              </dt>
              <dd className="text-foreground text-xs">{user.email}</dd>
            </div>
            {user.name && (
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="text-muted-foreground text-xs font-medium">
                  Name
                </dt>
                <dd className="text-foreground text-xs">{user.name}</dd>
              </div>
            )}
            {user.emailVerified && (
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="text-muted-foreground text-xs font-medium">
                  Account Created
                </dt>
                <dd className="text-foreground text-xs">
                  {new Date(user.emailVerified).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Jobber Account</CardTitle>
          <CardDescription>Connected Jobber account details</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="text-muted-foreground text-xs font-medium">
                Company Name
              </dt>
              <dd className="text-foreground text-xs">{accountData.name}</dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="text-muted-foreground text-xs font-medium">
                Industry
              </dt>
              <dd className="text-foreground text-xs">
                {accountData.industry}
              </dd>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="text-muted-foreground text-xs font-medium">
                Phone
              </dt>
              <dd className="text-foreground text-xs">{accountData.phone}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Invoice Lookup</CardTitle>
          <CardDescription>
            Send invoice lookup email to a client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SendEmailForm public_id={accountData.public_id} />
        </CardContent>
      </Card>

      {/* <div>
        TODO: Social links for
      </div> */}

      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>Add invoice lookup to your website</CardDescription>
        </CardHeader>
        <CardContent>
          <IntegrationTutorial public_id={accountData.public_id} />
        </CardContent>
      </Card>
    </div>
  );
}
