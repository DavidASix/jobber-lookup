"use client";

import { useSession, signOut } from "next-auth/react";
import { MagicLinkForm } from "~/app/_components/magic-link-form";
import { Button } from "~/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <p className="text-2xl text-white">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
        </h1>

        {!session?.user ? (
          // Unauthenticated: Show login form
          <div className="flex flex-col items-center gap-8">
            <p className="text-xl text-white/80 text-center max-w-md">
              Sign in to access your personalized dashboard
            </p>
            <MagicLinkForm />
          </div>
        ) : (
          // Authenticated: Show simple authed message
          <div className="flex flex-col items-center gap-4">
            <p className="text-2xl text-white">Authed</p>
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="outline"
              size="lg"
            >
              Sign out
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
