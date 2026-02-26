import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { semesterCourseMap } from "@/lib/db/schema/course";
import { adminGuard } from "@/lib/admin/auth-guard";
import { updateSemesterCourseMapSchema } from "@/lib/admin/validators";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const [data] = await db.select().from(semesterCourseMap).where(eq(semesterCourseMap.id, id));
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSemesterCourseMapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(semesterCourseMap)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(semesterCourseMap.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const [deleted] = await db.delete(semesterCourseMap).where(eq(semesterCourseMap.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
