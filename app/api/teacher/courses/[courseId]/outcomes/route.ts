import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseOutcome } from "@/lib/db/schema/course";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  description: z.string().min(1, "Description is required"),
});

/**
 * GET /api/teacher/courses/[courseId]/outcomes
 * Retrieves outcomes for a specific course assigned to the teacher.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await teacherGuard();
  if (error) return error;

  const { courseId } = await params;
  const outcomes = await db
    .select()
    .from(courseOutcome)
    .where(eq(courseOutcome.courseId, courseId))
    .orderBy(courseOutcome.code);

  return NextResponse.json(outcomes);
}

/**
 * POST /api/teacher/courses/[courseId]/outcomes
 * Creates a new outcome for the course.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await teacherGuard();
  if (error) return error;

  const { courseId } = await params;
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { code, description } = result.data;
    
    // Check if CO code already exists for this course
    const existing = await db
      .select()
      .from(courseOutcome)
      .where(eq(courseOutcome.courseId, courseId));
    
    if (existing.some(co => co.code.toLowerCase() === code.toLowerCase())) {
      return NextResponse.json({ error: "Course Outcome code already exists for this course" }, { status: 409 });
    }

    const [created] = await db
      .insert(courseOutcome)
      .values({
        courseId,
        code,
        description,
      })
      .returning();

    return NextResponse.json(created);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
