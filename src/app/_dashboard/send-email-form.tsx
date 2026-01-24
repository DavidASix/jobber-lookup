"use client";

import { useState, type FormEvent } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";

type FormStatus = "idle" | "loading" | "success" | "error";

export function SendEmailForm({ public_id }: { public_id: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setStatus("loading");

    try {
      const searchParams = new URLSearchParams({
        email,
        id: public_id,
      }).toString();
      const url = `/api/send-lookup-email?${searchParams}`;
      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        throw new Error("Could not send email");
      }

      setStatus("success");

      setTimeout(() => {
        setStatus("idle");
      }, 4500);
    } catch (error) {
      console.error("Error:", error);

      setTimeout(() => {
        setStatus("error");
      }, 500);

      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case "loading":
        return "Sending...";
      case "success":
        return "Email Sent!";
      case "error":
        return "Could not send email";
      default:
        return "Search Invoices";
    }
  };

  const isDisabled = status === "loading";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-medium">
          Client Email Address
        </Label>
        <Input
          type="email"
          id="email"
          placeholder="client@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isDisabled}
        />
      </div>

      <Button
        type="submit"
        disabled={isDisabled}
        variant={status === "error" ? "destructive" : "default"}
        className="w-full"
        size="lg"
      >
        {getButtonText()}
      </Button>

      {status === "success" && (
        <Alert>
          <AlertDescription>
            Email sent successfully! Your client should receive it shortly.
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>
            Could not send email. Please check the email address and try again.
            Contact developer if issue persists.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
