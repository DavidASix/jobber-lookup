"use client";

import { useState } from "react";
import { env } from "~/env";

function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm transition-colors"
      type="button"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function IntegrationTutorial({ public_id }: { public_id: string }) {
  const exampleCode = `<form onsubmit="submitForm(event)" class="flex flex-col">
  <label for="email" class="text-sm font-semibold">
    Email
  </label>
  <input
    type="email"
    id="email"
    placeholder="Enter your email"
    class="flex h-10 w-full rounded-md border px-3 py-2"
  />
  <button type="submit" class="mt-2 rounded-md btn">
    Search Invoices
  </button>
</form>

<script>
  function submitForm(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const button = document.querySelector('button[type="submit"]');

    button.disabled = true;
    button.innerHTML = 'Sending...';

    const url = '${env.NEXT_PUBLIC_PROJECT_URL}/api/send-lookup-email?id=${public_id}&email=' + email;

    fetch(url, { method: 'GET' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Could not send email');
        }
        button.innerHTML = 'Email Sent!';
      })
      .catch((error) => {
        console.error('Error:', error);
        button.classList.add('btn-warning');
        button.innerHTML = 'Could not send email';
      })
      .finally(() => {
        setTimeout(() => {
          button.disabled = false;
          button.classList.remove('btn-warning');
          button.innerHTML = 'Search Invoices';
        }, 4500);
      });
  }
</script>`;

  return (
    <div className="mx-auto space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold">Integration Guide</h1>
        <p className="text-muted-foreground">
          Add an email lookup form to your website
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your API Endpoint</h2>
        <div className="bg-muted relative rounded-md p-3">
          <div className="absolute top-2 right-2">
            <CopyButton
              textToCopy={`${env.NEXT_PUBLIC_PROJECT_URL}/api/send-lookup-email?id=${public_id}&email=Client_Email_Address`}
            />
          </div>
          <code className="text-sm break-all">
            {env.NEXT_PUBLIC_PROJECT_URL}/api/send-lookup-email?id=
            {public_id}
            &email=Client_Email_Address
          </code>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Example Implementation</h2>
        <p>
          You can copy and paste this implementation into your website to enable
          client invoice looks, our share it with your developer for
          implementation.
        </p>
        <div className="relative">
          <div className="absolute top-2 right-2 z-10">
            <CopyButton textToCopy={exampleCode} />
          </div>
          <pre className="bg-muted overflow-x-auto rounded-md p-4">
            <code className="text-sm">{exampleCode}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}
