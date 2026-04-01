import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import { computeAttendance } from "@/lib/attendance";
import { requireRole } from "@/lib/auth";

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["admin"]);
    if (!session) {
      return NextResponse.json({ error: "Only admin can view reports" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const today = new Date().toISOString().split("T")[0];
    const firstOfMonth = today.slice(0, 8) + "01";
    const startDate = searchParams.get("start_date") || firstOfMonth;
    const endDate = searchParams.get("end_date") || today;
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

    const dates = getDatesInRange(startDate, endDate);

    const logs = await db
      .collection("logs")
      .find({ date: { $gte: startDate, $lte: endDate } })
      .sort({ timestamp: 1 })
      .toArray() as any[];

    const report = employees.map((emp) => {
      const records = dates.map((date) =>
        computeAttendance(emp.employee_id, emp.name, date, logs)
      );

      const presentDays = records.filter((r) => r.status === "present").length;
      const partialDays = records.filter((r) => r.status === "partial").length;
      const absentDays = records.filter((r) => r.status === "absent").length;
      const totalMinutes = records.reduce((sum, r) => sum + r.total_minutes, 0);
      const overtimeMinutes = records.reduce((sum, r) => sum + r.overtime_minutes, 0);

      return {
        employee_id: emp.employee_id,
        employee_name: emp.name,
        department: emp.department,
        present_days: presentDays,
        partial_days: partialDays,
        absent_days: absentDays,
        total_minutes: totalMinutes,
        overtime_minutes: overtimeMinutes,
        records,
      };
    });

    return NextResponse.json({ report, start_date: startDate, end_date: endDate });
  } catch (err) {
    console.error("Report error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
