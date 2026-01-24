"use client";

import type { User } from "next-auth";
import { api } from "~/trpc/react";
import { LoadingState } from "../_components/loading-state";
import { Button } from "~/components/ui/button";
import { useState } from "react";

export function Dashboard({ user }: { user: User }) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const { data: publicId, status: publicIdStatus } =
    api.jobber.getPublicId.useQuery();

  const { data: authUrl } = api.jobber.getAuthorizationUrl.useQuery(undefined, {
    enabled: publicId === null && !isAuthorizing,
  });

  const handleAuthorize = async () => {
    if (isAuthorizing) return;
    if (!authUrl) {
      // TODO: toast and give escape hatch
    }
    setIsAuthorizing(true);
    window.open(authUrl, "_blank");
  };

  if (publicIdStatus === "pending") {
    return <LoadingState />;
  }
  
  if (!publicId) {
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
  return (
    <>
      <p>{JSON.stringify(user)}</p>
    </>
  );
}
