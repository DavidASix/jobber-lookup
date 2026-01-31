-- Add connection status columns to jobber_accounts
ALTER TABLE "jobber_accounts"
ADD COLUMN "connection_status" text DEFAULT 'disconnected' NOT NULL;

ALTER TABLE "jobber_accounts"
ADD COLUMN "disconnected_at" timestamp;

-- Add expires_at column with default value
ALTER TABLE "jobber_tokens"
ADD COLUMN "expires_at" timestamp DEFAULT now() NOT NULL;