import "dotenv/config";

import { createInterface } from "readline";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";

const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const confirmMigration = (): Promise<boolean> => {
  return new Promise((resolve) => {
    readline.question(
      "\n⚠️ WARNING: You are about to run migrations on the PRODUCTION database! ⚠️\nAre you sure you want to continue? (yes/no): ",
      (answer) => {
        resolve(answer.toLowerCase() === "yes");
      },
    );
  });
};

const runMigration = async () => {
  const connectionString = process.env.PRODUCTION_DATABASE_URL;

  if (!connectionString) {
    throw new Error("DB String Missing");
  }

  const migrationsFolder = path.join(process.cwd(), "drizzle");
  console.log("Migrations folder:", migrationsFolder);
  console.log(
    "Target database:",
    connectionString.split("@")[1]?.split("/")[0] ?? "unknown",
  );

  const confirmed = await confirmMigration();

  if (confirmed) {
    console.log("Starting migration...");
    const client = postgres(connectionString);
    const db = drizzle(client);

    try {
      await migrate(db, { migrationsFolder });
      console.log("Migration completed successfully!");
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    } finally {
      await client.end();
      readline.close();
    }
  } else {
    console.log("Migration cancelled.");
    readline.close();
  }
};

void runMigration();
