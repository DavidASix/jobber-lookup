"use client";

import { useSession } from "next-auth/react";
import { MagicLinkForm } from "~/app/_components/magic-link-form";
import { LoadingState } from "~/app/_components/loading-state";
import { Header } from "~/app/_components/header";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingState />;
  }

  if (!session?.user) {
    return (
      <div className="flex h-screen w-screen flex-col">
        <Header showSignOut={false} />
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <h1 className="text-foreground text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Jobber Quote Lookup Tool
          </h1>
          <p className="text-muted-foreground max-w-md text-center text-xl">
            Sign in to access your personalized dashboard
          </p>
          <MagicLinkForm />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col">
      <Header showSignOut={true} />
      <div className="flex flex-1 items-center justify-center">
        <h3 className="text-foreground text-3xl font-semibold">example</h3>
      </div>
    </div>
  );
}
