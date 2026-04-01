import getDb from "@/lib/db";

export async function getLogsByDate(date: string, employeeId?: string) {
  const db = await getDb();
  const query: Record<string, string> = { date };
  if (employeeId) query.employee_id = employeeId;
  return db.collection("logs").find(query).sort({ timestamp: 1 }).toArray();
}

export async function getRecentLogs(date: string, limit = 10) {
  const db = await getDb();
  return db.collection("logs").find({ date }).sort({ timestamp: -1 }).limit(limit).toArray();
}

export async function createLog(data: { employee_id: string; employee_name: string; type: "IN" | "OUT"; date: string }) {
  const db = await getDb();
  const doc = { ...data, timestamp: new Date().toISOString() };
  const result = await db.collection("logs").insertOne(doc);
  return { id: result.insertedId.toString(), ...doc };
}

export async function countLogsByDate(date: string) {
  const db = await getDb();
  return db.collection("logs").countDocuments({ date });
}

export async function getPresentEmployeeIds(date: string) {
  const db = await getDb();
  return db.collection("logs").distinct("employee_id", { date, type: "IN" });
}

export async function getLastLogForEmployee(employeeId: string, date: string) {
  const db = await getDb();
  return db.collection("logs").findOne(
    { employee_id: employeeId, date },
    { sort: { timestamp: -1 } }
  );
}
