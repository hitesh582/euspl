import getDb from "@/lib/db";
import { ObjectId } from "mongodb";
import { generateEmployeeId } from "@/lib/utils";

export interface EmployeeDoc {
  id: string;
  employee_id: string;
  name: string;
  department?: string;
  position?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

function toEmployee(doc: Record<string, any>): EmployeeDoc {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest } as EmployeeDoc;
}

export async function getEmployees(): Promise<EmployeeDoc[]> {
  const db = await getDb();
  const docs = await db.collection("employees").find().sort({ created_at: -1 }).toArray();
  return docs.map(toEmployee);
}

export async function getEmployeeById(id: string): Promise<EmployeeDoc | null> {
  const db = await getDb();
  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { employee_id: id };
  const doc = await db.collection("employees").findOne(query);
  if (!doc) return null;
  return toEmployee(doc);
}

export async function createEmployee(data: { name: string; department?: string; position?: string; email?: string; phone?: string }) {
  const db = await getDb();
  const employee_id = generateEmployeeId();
  const doc = {
    ...data,
    employee_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const result = await db.collection("employees").insertOne(doc);
  return { id: result.insertedId.toString(), ...doc };
}

export async function updateEmployee(id: string, data: Record<string, unknown>) {
  const db = await getDb();
  const result = await db.collection("employees").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...data, updated_at: new Date().toISOString() } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return { id: result._id.toString(), ...result, _id: undefined };
}

export async function deleteEmployee(id: string) {
  const db = await getDb();
  const emp = await db.collection("employees").findOne({ _id: new ObjectId(id) });
  if (!emp) return false;
  await db.collection("employees").deleteOne({ _id: new ObjectId(id) });
  await db.collection("logs").deleteMany({ employee_id: emp.employee_id });
  return true;
}

export async function countEmployees() {
  const db = await getDb();
  return db.collection("employees").countDocuments();
}
