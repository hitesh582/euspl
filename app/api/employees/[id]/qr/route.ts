import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import QRCode from "qrcode";
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

    const qrDataUrl = await QRCode.toDataURL(employee.employee_id, {
      width: 400,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return NextResponse.json({ qrCode: qrDataUrl, employeeId: employee.employee_id });
  } catch (err) {
    console.error("QR error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
