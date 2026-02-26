import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { academicYear } from "@/lib/db/schema/academic";
import { adminGuard } from "@/lib/admin/auth-guard";
import { createAcademicYearSchema } from "@/lib/admin/validators";
import { eq } from "drizzle-orm";

export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const data = await db.select().from(academicYear);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { error } = await adminGuard();
  if (error) return error;

  const body = await req.json();
  const parsed = createAcademicYearSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check for duplicate
  const existing = await db
    .select()
    .from(academicYear)
    .where(eq(academicYear.regulationId, parsed.data.regulationId));

  if (existing.some((e) => e.yearNumber === parsed.data.yearNumber)) {
    return NextResponse.json({ error: "Year already exists for this regulation" }, { status: 409 });
  }

  const [created] = await db.insert(academicYear).values(parsed.data).returning();
  return NextResponse.json(created, { status: 201 });
}
