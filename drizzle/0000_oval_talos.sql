CREATE TABLE
	"account" (
		"userId" varchar(255) NOT NULL,
		"type" varchar(255) NOT NULL,
		"provider" varchar(255) NOT NULL,
		"providerAccountId" varchar(255) NOT NULL,
		"refresh_token" text,
		"access_token" text,
		"expires_at" integer,
		"token_type" varchar(255),
		"scope" varchar(255),
		"id_token" text,
		"session_state" varchar(255),
		CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY ("provider", "providerAccountId")
	);

--> statement-breakpoint
CREATE TABLE
	"session" (
		"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
		"userId" varchar(255) NOT NULL,
		"expires" timestamp with time zone NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	"user" (
		"id" varchar(255) PRIMARY KEY NOT NULL,
		"name" varchar(255),
		"email" varchar(255) NOT NULL,
		"emailVerified" timestamp with time zone,
		"image" varchar(255)
	);

--> statement-breakpoint
CREATE TABLE
	"verification_token" (
		"identifier" varchar(255) NOT NULL,
		"token" varchar(255) NOT NULL,
		"expires" timestamp with time zone NOT NULL,
		CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY ("identifier", "token")
	);

--> statement-breakpoint
CREATE TABLE
	"jobber_account" (
		"id" serial PRIMARY KEY NOT NULL,
		"public_id" uuid DEFAULT gen_random_uuid (),
		"user_id" text NOT NULL,
		"jobber_id" text NOT NULL,
		"name" text,
		"signupName" text,
		"industry" text,
		"phone" text
	);

--> statement-breakpoint
CREATE TABLE
	"jobber_tokens" (
		"id" serial PRIMARY KEY NOT NULL,
		"access_token" text NOT NULL,
		"refresh_token" text NOT NULL,
		"user_id" text NOT NULL,
		"created_at" timestamp DEFAULT now() NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	"state_connections" (
		"id" serial PRIMARY KEY NOT NULL,
		"valid" boolean DEFAULT true NOT NULL,
		"state" text NOT NULL,
		"user_id" text NOT NULL,
		"created_at" timestamp DEFAULT now() NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	"setup_step" (
		"id" serial PRIMARY KEY NOT NULL,
		"step" integer NOT NULL,
		"user_id" text NOT NULL
	);

--> statement-breakpoint
ALTER TABLE "account"
ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user" ("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "session"
ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user" ("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "jobber_account"
ADD CONSTRAINT "jobber_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "jobber_tokens"
ADD CONSTRAINT "jobber_tokens_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "state_connections"
ADD CONSTRAINT "state_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "setup_step"
ADD CONSTRAINT "setup_step_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("userId");

--> statement-breakpoint
CREATE INDEX "t_user_id_idx" ON "session" USING btree ("userId");