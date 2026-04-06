import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getTodayDate } from "@/lib/utils";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(["admin", "guard"]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = await getDb();
    const today = getTodayDate();

    const totalEmployees = await db.collection("employees").countDocuments();

    const presentIds = await db
      .collection("logs")
      .distinct("employee_id", { date: today, type: "IN" });
    const presentToday = presentIds.length;

    const totalLogsToday = await db.collection("logs").countDocuments({ date: today });

    const absentToday = Math.max(0, totalEmployees - presentToday);

    const recentLogs = await db
      .collection("logs")
      .find()
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    const empIds = [...new Set(recentLogs.map((l) => l.employee_id))];
    const employees = await db
      .collection("employees")
      .find({ employee_id: { $in: empIds } })
      .toArray();
    const empMap = Object.fromEntries(employees.map((e) => [e.employee_id, e.name]));

    const recentScans = recentLogs.map((l) => ({
      ...l,
      id: l._id.toString(),
      _id: undefined,
      employee_name: empMap[l.employee_id] || "Unknown",
    }));

    return NextResponse.json({
      total_employees: totalEmployees,
      present_today: presentToday,
      absent_today: absentToday,
      total_logs_today: totalLogsToday,
      recent_scans: recentScans,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
