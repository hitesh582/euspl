import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/euspl";

let client: MongoClient;
let db: Db;

async function getDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  // Create indexes
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("employees").createIndex({ employee_id: 1 }, { unique: true });
  await db.collection("logs").createIndex({ employee_id: 1, date: 1 });
  await db.collection("logs").createIndex({ timestamp: 1 });

  return db;
}

export default getDb;
