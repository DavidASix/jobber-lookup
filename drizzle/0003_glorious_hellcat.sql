ALTER TABLE "jobber_accounts"
ADD CONSTRAINT "jobber_accounts_user_id_jobber_id_unique" UNIQUE ("user_id", "jobber_id");