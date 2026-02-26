import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teacherAllocation } from "@/lib/db/schema/enrollment";
import { adminGuard } from "@/lib/admin/auth-guard";
import { createTeacherAllocationSchema } from "@/lib/admin/validators";

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const data = await db.select().from(teacherAllocation);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const body = await req.json();
  const parsed = createTeacherAllocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db.insert(teacherAllocation).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}
