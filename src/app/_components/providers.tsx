"use client";

import { SessionProvider } from "next-auth/react";
import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { Header } from "./header";
import { Toaster } from "~/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        <SessionProvider>
          <main className="flex h-screen w-screen flex-col items-center justify-center">
            <Header />
            <div className="w-full max-w-300 flex-1 overflow-scroll">
              {children}
            </div>
            <Toaster position="top-right" />
          </main>
        </SessionProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
