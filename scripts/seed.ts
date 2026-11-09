/**
 * `npm run seed`: (re)create the schema and reset the database to the demo
 * dataset. DESTRUCTIVE: deletes all users, sessions, documents and shares.
 *
 * Uses DATABASE_URL / DATABASE_AUTH_TOKEN from the environment or .env.local,
 * so the same command seeds the local SQLite file or a Turso database.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local; fall back to process env / defaults
}
process.env.DISABLE_AUTO_SEED = "1";

async function main() {
  const { getDb } = await import("../src/lib/db");
  const { resetAndSeed, SEED_USERS } = await import("../src/lib/seed");
  const db = await getDb();
  await resetAndSeed(db);
  const target = process.env.DATABASE_URL || "file:./data/app.db";
  console.log(`Seeded ${target}`);
  console.log(`Demo users: ${SEED_USERS.map((u) => u.email).join(", ")}`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
