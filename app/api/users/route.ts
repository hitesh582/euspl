import { NextResponse } from "next/server";
import getDb from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireRole(["admin"]);
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getDb();
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Get users error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
