import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz } from "@/lib/db/schema/assessment";
import { teacherAllocation } from "@/lib/db/schema/enrollment";
import { semesterCourseMap } from "@/lib/db/schema/course";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { createQuizSchema } from "@/lib/admin/validators";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/teacher/quizzes — list quizzes created by the teacher
 * POST /api/teacher/quizzes — create a quiz for an allocated course
 */
export async function GET() {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const quizzes = await db
    .select()
    .from(quiz)
    .where(eq(quiz.createdBy, session!.user.id));

  return NextResponse.json(quizzes);
}

export async function POST(req: Request) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const body = await req.json();
  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session!.user.id;

  // Verify the teacher is allocated to the course
  const allocations = await db
    .select()
    .from(teacherAllocation)
    .innerJoin(semesterCourseMap, eq(teacherAllocation.semesterCourseMapId, semesterCourseMap.id))
    .where(
      and(
        eq(teacherAllocation.userId, userId),
        eq(semesterCourseMap.courseId, parsed.data.courseId)
      )
    );

  if (allocations.length === 0) {
    return NextResponse.json(
      { error: "You are not allocated to this course" },
      { status: 403 }
    );
  }

  const [created] = await db
    .insert(quiz)
    .values({ ...parsed.data, createdBy: userId })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
