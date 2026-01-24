"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme/theme-toggle";

export function Header() {
  const { data: session } = useSession();
  return (
    <header className="border-border bg-background w-full border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-foreground text-2xl font-bold">JQLT</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="outline"
              size="default"
            >
              Sign out
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
