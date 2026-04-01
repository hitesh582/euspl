/**
 * Bootstrap script: Promote a user to admin by email.
 *
 * Usage:
 *   node scripts/promote-admin.mjs your@email.com
 *
 * Requires MONGODB_URI in .env.local or as environment variable.
 */

import { MongoClient } from "mongodb";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/euspl";
const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    if (user.role === "admin") {
      console.log(`User "${user.name}" (${email}) is already an admin.`);
      process.exit(0);
    }

    await db.collection("users").updateOne(
      { email },
      { $set: { role: "admin", updated_at: new Date().toISOString() } }
    );

    console.log(`Successfully promoted "${user.name}" (${email}) to admin.`);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
