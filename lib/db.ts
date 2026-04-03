import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/euspl";

let client: MongoClient;
let db: Db;

async function getDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast instead of 30s timeout
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  await client.connect();
  db = client.db();

  // Create indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("employees").createIndex({ employee_id: 1 }, { unique: true });
  await db.collection("logs").createIndex({ employee_id: 1, date: 1 });
  await db.collection("logs").createIndex({ timestamp: 1 });
  
  // Remember tokens indexes
  await db.collection("remember_tokens").createIndex(
    { userId: 1, tokenHash: 1 },
    { unique: true }
  );
  await db.collection("remember_tokens").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  );
  await db.collection("remember_tokens").createIndex(
    { userId: 1, createdAt: 1 }
  );

  // Password reset tokens indexes
  await db.collection("password_reset_tokens").createIndex(
    { token: 1 },
    { unique: true }
  );
  await db.collection("password_reset_tokens").createIndex(
    { user_id: 1 }
  );
  await db.collection("password_reset_tokens").createIndex(
    { expires_at: 1 },
    { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  );

  // Password reset attempts indexes
  await db.collection("password_reset_attempts").createIndex(
    { email: 1 }
  );
  await db.collection("password_reset_attempts").createIndex(
    { expires_at: 1 },
    { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  );

  return db;
}

export default getDb;
