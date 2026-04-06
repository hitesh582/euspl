import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["admin", "guard"]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const db = await getDb();
    const employee = await db.collection("employees").findOne({
      $or: [
        ...(ObjectId.isValid(id) ? [{ _id: new ObjectId(id) }] : []),
        { employee_id: id },
      ],
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const logs = await db
      .collection("logs")
      .find({ employee_id: employee.employee_id })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    const mappedEmployee = { id: employee._id.toString(), ...employee, _id: undefined };
    const mappedLogs = logs.map((l) => ({ id: l._id.toString(), ...l, _id: undefined }));

    return NextResponse.json({ employee: mappedEmployee, logs: mappedLogs });
  } catch (err) {
    console.error("Get employee error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["admin"]);
    if (!session) {
      return NextResponse.json({ error: "Only admin can update employees" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, department, position, email, phone } = body;

    if (!name) {
      return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
    }

    const db = await getDb();
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { employee_id: id };
    const employee = await db.collection("employees").findOne(filter);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    await db.collection("employees").updateOne(
      { _id: employee._id },
      {
        $set: {
          name,
          department: department || null,
          position: position || null,
          email: email || null,
          phone: phone || null,
          updated_at: now,
        },
      }
    );

    const updated = await db.collection("employees").findOne({ _id: employee._id });
    return NextResponse.json({ employee: { id: updated!._id.toString(), ...updated, _id: undefined } });
  } catch (err) {
    console.error("Update employee error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["admin"]);
    if (!session) {
      return NextResponse.json({ error: "Only admin can delete employees" }, { status: 403 });
    }

    const { id } = await params;
    const db = await getDb();
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { employee_id: id };
    const employee = await db.collection("employees").findOne(filter);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    await db.collection("logs").deleteMany({ employee_id: employee.employee_id });
    await db.collection("employees").deleteOne({ _id: employee._id });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete employee error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
