CREATE TYPE "public"."log_type" AS ENUM('api_call', 'email_sent');

CREATE TABLE
	"usage_logs" (
		"id" serial PRIMARY KEY NOT NULL,
		"user_id" text NOT NULL,
		"jobber_account_id" integer,
		"log_type" "log_type" NOT NULL,
		"route" text NOT NULL,
		"metadata" jsonb,
		"created_at" timestamp DEFAULT now() NOT NULL
	);

ALTER TABLE "usage_logs"
ADD CONSTRAINT "usage_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "usage_logs"
ADD CONSTRAINT "usage_logs_jobber_account_id_jobber_accounts_id_fk" FOREIGN KEY ("jobber_account_id") REFERENCES "public"."jobber_accounts" ("id") ON DELETE cascade ON UPDATE no action;