import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import { computeAttendance } from "@/lib/attendance";
import { getTodayDate } from "@/lib/utils";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["admin", "guard"]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || getTodayDate();
    const employeeId = searchParams.get("employee_id");

    const db = await getDb();

    let employees: any[];
    if (employeeId) {
      const emp = await db.collection("employees").findOne({
        $or: [
          ...(ObjectId.isValid(employeeId) ? [{ _id: new ObjectId(employeeId) }] : []),
          { employee_id: employeeId },
        ],
      });
      employees = emp ? [emp] : [];
    } else {
      employees = await db.collection("employees").find().sort({ name: 1 }).toArray();
    }

    const logs = await db
      .collection("logs")
      .find({ date })
      .sort({ timestamp: 1 })
      .toArray() as any[];

    const attendance = employees.map((emp) =>
      computeAttendance(emp.employee_id, emp.name, date, logs)
    );

    return NextResponse.json({ attendance, date });
  } catch (err) {
    console.error("Attendance error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
