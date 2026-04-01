import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import getDb from "@/lib/db";
import { requireRole, ALLOWED_ROLES, type UserRole } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["admin"]);
    if (!session) {
      return NextResponse.json({ error: "Only admin can assign roles" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { role } = body;

    if (!role || !ALLOWED_ROLES.includes(role as UserRole)) {
      return NextResponse.json({ error: "Invalid role. Must be: user, admin, or guard" }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (session.userId === id && role !== "admin") {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const db = await getDb();

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const result = await db.collection("users").findOneAndUpdate(
      { _id: objectId },
      { $set: { role, updated_at: new Date().toISOString() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: result });
  } catch (err) {
    console.error("Update role error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
