"use client";

import { api } from "~/trpc/react";

import { useState, type FormEvent } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import z from "zod";

type FormStatus = "idle" | "loading" | "success" | "error";

export function SendEmailForm({ public_id }: { public_id: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const utils = api.useUtils();

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

      const responseContent: unknown = await response.json();
      const responseSchema = z.object({
        success: z.boolean(),
        message: z.string(),
      });

      const parsedResponse = responseSchema.safeParse(responseContent);

      await utils.jobber.getAccountData.invalidate();
      await utils.jobber.getAccountStatuses.invalidate();
      await utils.jobber.getLookupStats.invalidate();

      if (parsedResponse.success && parsedResponse.data.success === false) {
        setStatus("error");
        setStatusMessage(
          parsedResponse.data.message ||
            "The request succeeded, but there was a problem with the information provided.",
        );
      } else {
        setStatus("success");
        setStatusMessage(
          "Email sent successfully! Your client should receive it shortly.",
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setStatusMessage(
        "Could not send email. Please try again.\nContact developer if issue persists.",
      );
      setStatus("error");
    } finally {
      setTimeout(() => {
        setStatus("idle");
        setStatusMessage(null);
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

      {status === "success" || status === "error" ? (
        <Alert variant={status === "error" ? "destructive" : "default"}>
          <AlertDescription>
            {statusMessage ?? "Request Completed"}
          </AlertDescription>
        </Alert>
      ) : null}
    </form>
  );
}
