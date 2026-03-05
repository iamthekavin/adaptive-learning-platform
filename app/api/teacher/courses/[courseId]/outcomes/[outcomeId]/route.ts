import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseOutcome } from "@/lib/db/schema/course";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().min(1, "Description is required"),
});

/**
 * PUT /api/teacher/courses/[courseId]/outcomes/[outcomeId]
 * Updates an outcome
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string; outcomeId: string }> }
) {
  const { error } = await teacherGuard();
  if (error) return error;

  const { courseId, outcomeId } = await params;

  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { code, description } = result.data;

    // Check if new code conflicts with another CO in the same course
    const existing = await db
      .select()
      .from(courseOutcome)
      .where(eq(courseOutcome.courseId, courseId));

    if (existing.some(co => co.id !== outcomeId && co.code.toLowerCase() === code.toLowerCase())) {
      return NextResponse.json({ error: "Course Outcome code already exists" }, { status: 409 });
    }

    const [updated] = await db
      .update(courseOutcome)
      .set({ code, description, updatedAt: new Date() })
      .where(and(eq(courseOutcome.id, outcomeId), eq(courseOutcome.courseId, courseId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Outcome not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/teacher/courses/[courseId]/outcomes/[outcomeId]
 * Deletes an outcome (assuming cascade deletion where necessary or checking for dependent questions)
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; outcomeId: string }> }
) {
  const { error } = await teacherGuard();
  if (error) return error;

  const { courseId, outcomeId } = await params;

  // Real world: Might want to check if any questions use this CO before deleting
  const [deleted] = await db
    .delete(courseOutcome)
    .where(and(eq(courseOutcome.id, outcomeId), eq(courseOutcome.courseId, courseId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Outcome not found" }, { status: 404 });
  }

  return NextResponse.json(deleted);
}
