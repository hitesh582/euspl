import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";
import { getTodayDate } from "@/lib/utils";
import { requireRole } from "@/lib/auth";

const DUPLICATE_SCAN_INTERVAL_SECONDS = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["admin", "guard"]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const db = await getDb();

    const employee = await db
      .collection("employees")
      .findOne({ employee_id: employeeId });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found. Invalid QR code." }, { status: 404 });
    }

    const today = getTodayDate();
    const now = new Date();

    const lastLog = await db
      .collection("logs")
      .findOne(
        { employee_id: employeeId },
        { sort: { timestamp: -1 } }
      );

    if (lastLog) {
      const lastTime = new Date(lastLog.timestamp);
      const diffSeconds = (now.getTime() - lastTime.getTime()) / 1000;
      if (diffSeconds < DUPLICATE_SCAN_INTERVAL_SECONDS) {
        return NextResponse.json(
          {
            error: `Duplicate scan. Please wait ${Math.ceil(DUPLICATE_SCAN_INTERVAL_SECONDS - diffSeconds)} more seconds.`,
            duplicate: true,
          },
          { status: 429 }
        );
      }
    }

    const todayLogs = await db
      .collection("logs")
      .find({ employee_id: employeeId, date: today })
      .sort({ timestamp: 1 })
      .toArray();

    let scanType: "IN" | "OUT" = "IN";
    if (todayLogs.length > 0) {
      const lastTodayLog = todayLogs[todayLogs.length - 1];
      scanType = lastTodayLog.type === "IN" ? "OUT" : "IN";
    }

    const timestamp = now.toISOString();

    await db.collection("logs").insertOne({
      employee_id: employeeId,
      type: scanType,
      timestamp,
      date: today,
    });

    return NextResponse.json({
      success: true,
      employeeId,
      employeeName: employee.name,
      type: scanType,
      timestamp,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
