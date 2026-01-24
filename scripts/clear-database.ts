import postgres from "postgres";
import "dotenv/config";

/**
 * Clears and recreates databases by dropping and creating them again.
 *
 * This function:
 * 1. Connects to the PostgreSQL admin database using DATABASE_URL environment variable
 * 2. Drops the main database and "test" database if they exist
 * 3. Creates new empty versions of these databases
 * 4. Grants appropriate privileges to the database user
 *
 * @throws {Error} If DATABASE_URL is not set or if database operations fail
 * @returns {Promise<void>} Exits the process with code 0 on success, code 1 on failure
 */
async function clearDatabase() {
  // Make sure we have a database URL
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set in the environment variables");
    process.exit(1);
  }

  // Parse DATABASE_URL to extract database name and user
  const url = new URL(process.env.DATABASE_URL);
  const mainDbName = url.pathname.slice(1); // Remove leading '/'
  const dbUser = url.username;
  const testDbName = "test";

  if (!mainDbName || !dbUser) {
    console.error("Could not parse database name or user from DATABASE_URL");
    process.exit(1);
  }

  console.log(`Parsed from DATABASE_URL:`);
  console.log(`  Main database: ${mainDbName}`);
  console.log(`  Database user: ${dbUser}`);
  console.log(`  Test database: ${testDbName}`);

  // Modify the connection URL to connect to postgres database instead
  const connectionString = process.env.DATABASE_URL.replace(
    new RegExp(`\\/${mainDbName}($|\\?)`),
    "/postgres$1",
  );
  console.log(`Connecting to admin database: ${connectionString}`);

  // Connect to the postgres database
  const client = postgres(connectionString);

  try {
    console.log(
      "Connected to postgres database. Preparing to drop and recreate target databases...",
    );

    // Now we can drop other databases safely
    await client.unsafe(`DROP DATABASE IF EXISTS "${mainDbName}" WITH (FORCE)`);
    await client.unsafe(`CREATE DATABASE "${mainDbName}"`);
    await client.unsafe(
      `GRANT ALL PRIVILEGES ON DATABASE "${mainDbName}" TO ${dbUser}`,
    );

    await client.unsafe(`DROP DATABASE IF EXISTS "${testDbName}" WITH (FORCE)`);
    await client.unsafe(`CREATE DATABASE "${testDbName}"`);
    await client.unsafe(
      `GRANT ALL PRIVILEGES ON DATABASE "${testDbName}" TO ${dbUser}`,
    );

    console.log("Successfully cleared and recreated the databases.");
    process.exit(0); // Exit with success code
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1); // Exit with error code
  } finally {
    // Close the client before exiting
    await client.end();
  }
}

// Execute the function
void clearDatabase();

/**
 * SQL equivalent commands:
 *
 * -- Standard SQL commands for database operations
 *
 * -- Drop and recreate the main database
 * DROP DATABASE IF EXISTS "<main_db>" WITH (FORCE);
 * CREATE DATABASE "<main_db>";
 * GRANT ALL PRIVILEGES ON DATABASE "<main_db>" TO <db_user>;
 *
 * -- Drop and recreate the test database
 * DROP DATABASE IF EXISTS "test" WITH (FORCE);
 * CREATE DATABASE "test";
 * GRANT ALL PRIVILEGES ON DATABASE "test" TO <db_user>;
 *
 * -- Note: The connection to the postgres administrative database
 * -- would need to be established through your client application
 * -- before running these commands.
 */
