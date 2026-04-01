import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import getDb from "@/lib/db";
import { signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    // First user in the system becomes admin, all others become "user"
    const userCount = await db.collection("users").countDocuments();
    const assignedRole = userCount === 0 ? "admin" : "user";

    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashed,
      role: assignedRole,
      created_at: new Date().toISOString(),
    });

    const user = { id: result.insertedId.toString(), name, email, role: assignedRole };

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
