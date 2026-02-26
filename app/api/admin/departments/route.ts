import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { department } from "@/lib/db/schema/academic";
import { adminGuard } from "@/lib/admin/auth-guard";
import { createDepartmentSchema } from "@/lib/admin/validators";

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const data = await db.select().from(department);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const body = await req.json();
  const parsed = createDepartmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [created] = await db.insert(department).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}
