"use client";

import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme/theme-toggle";

interface HeaderProps {
  showSignOut?: boolean;
}

export function Header({ showSignOut = false }: HeaderProps) {
  return (
    <header className="border-border bg-background w-full border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-foreground text-2xl font-bold">
          Jobber Quote Lookup Tool
        </h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {showSignOut && (
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
