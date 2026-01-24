"use client";

import { useSession } from "next-auth/react";
import { MagicLinkForm } from "~/app/_components/magic-link-form";
import { LoadingState } from "~/app/_components/loading-state";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingState />;
  }

  if (!session?.user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <h1 className="text-foreground text-center text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Jobber Quote
          <br />
          Lookup Tool
        </h1>
        <p className="text-muted-foreground max-w-md text-center text-xl">
          Sign in to access your personalized dashboard
        </p>
        <MagicLinkForm />
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <h3 className="text-foreground text-3xl font-semibold">Dashboard</h3>
    </div>
  );
}
