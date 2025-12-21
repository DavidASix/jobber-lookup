"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    message?: string;
  }>({ type: "idle" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const result = await signIn("email", {
          email,
          redirect: false,
          callbackUrl: "/",
        });

        if (result?.error) {
          setStatus({
            type: "error",
            message: "Failed to send magic link. Please try again.",
          });
        } else {
          setStatus({
            type: "success",
            message: "Check your email for the magic link!",
          });
          setEmail("");
        }
      } catch {
        setStatus({
          type: "error",
          message: "Something went wrong. Please try again.",
        });
      }
    });
  };

  return (
    <Card className="border-border bg-card w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-card-foreground text-2xl">Sign In</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email to receive a magic link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              className="bg-input text-foreground placeholder:text-muted-foreground border-input"
            />
          </div>

          {status.type !== "idle" && (
            <Alert
              variant={status.type === "error" ? "destructive" : "default"}
            >
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !email}
            size="lg"
          >
            {isPending ? "Sending..." : "Send Magic Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
