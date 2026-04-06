import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { generateEmployeeId } from "@/lib/utils";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["admin", "guard"]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = await getDb();
    const raw = await db.collection("employees").find().sort({ name: 1 }).toArray();
    const employees = raw.map((e) => ({ id: e._id.toString(), ...e, _id: undefined }));
    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Get employees error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["admin"]);
    if (!session) {
      return NextResponse.json({ error: "Only admin can create employees" }, { status: 403 });
    }

    const body = await req.json();
    const { name, department, position, email, phone } = body;

    if (!name) {
      return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
    }

    const db = await getDb();
    let employeeId = generateEmployeeId();

    let attempt = 0;
    while (await db.collection("employees").findOne({ employee_id: employeeId }) && attempt < 10) {
      employeeId = generateEmployeeId();
      attempt++;
    }

    const now = new Date().toISOString();
    const employee = {
      employee_id: employeeId,
      name,
      department: department || null,
      position: position || null,
      email: email || null,
      phone: phone || null,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection("employees").insertOne(employee);
    return NextResponse.json({ employee: { id: result.insertedId.toString(), ...employee } }, { status: 201 });
  } catch (err) {
    console.error("Create employee error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
