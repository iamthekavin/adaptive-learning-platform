import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { semester } from "@/lib/db/schema/academic";
import { adminGuard } from "@/lib/admin/auth-guard";
import { createSemesterSchema } from "@/lib/admin/validators";
import { eq } from "drizzle-orm";

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const data = await db.select().from(semester);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const body = await req.json();
  const parsed = createSemesterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check for duplicate
  const existing = await db
    .select()
    .from(semester)
    .where(eq(semester.academicYearId, parsed.data.academicYearId));

  if (existing.some((e) => e.semesterNumber === parsed.data.semesterNumber)) {
    return NextResponse.json({ error: "Semester already exists for this academic year" }, { status: 409 });
  }

  const [created] = await db.insert(semester).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}
