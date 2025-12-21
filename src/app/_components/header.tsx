"use client";

import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

export function Header() {
  return (
    <header className="border-border bg-background w-full border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-foreground text-2xl font-bold">
          Jobber Quote Lookup Tool
        </h1>
        <Button
          onClick={() => signOut({ callbackUrl: "/" })}
          variant="outline"
          size="default"
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
