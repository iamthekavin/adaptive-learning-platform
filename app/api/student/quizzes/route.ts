import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz } from "@/lib/db/schema/assessment";
import { semesterCourseMap, course } from "@/lib/db/schema/course";
import { studentEnrollment, batch } from "@/lib/db/schema/enrollment";
import { semester } from "@/lib/db/schema/academic";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/student/quizzes
 * Returns published quizzes for the student's current-semester courses.
 */
export async function GET() {
  const { error, session } = await studentGuard();
  if (error) return error;

  const userId = session!.user.id;

  // Get enrollment
  const [enrollment] = await db
    .select()
    .from(studentEnrollment)
    .where(eq(studentEnrollment.userId, userId));

  if (!enrollment) return NextResponse.json([]);

  // Get batch → programId
  const [studentBatch] = await db
    .select()
    .from(batch)
    .where(eq(batch.id, enrollment.batchId));

  if (!studentBatch) return NextResponse.json([]);

  // Get course IDs for student's current semester
  const mappings = await db
    .select({ courseId: semesterCourseMap.courseId })
    .from(semesterCourseMap)
    .innerJoin(semester, eq(semesterCourseMap.semesterId, semester.id))
    .where(
      and(
        eq(semesterCourseMap.programId, studentBatch.programId),
        eq(semester.semesterNumber, enrollment.currentSemester)
      )
    );

  if (mappings.length === 0) return NextResponse.json([]);

  const courseIds = mappings.map((m) => m.courseId);

  // Get published quizzes for those courses
  const quizzes = await db
    .select({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      courseId: quiz.courseId,
      courseName: course.name,
      courseCode: course.code,
      durationMinutes: quiz.durationMinutes,
      maxAttempts: quiz.maxAttempts,
      totalMarks: quiz.totalMarks,
      createdAt: quiz.createdAt,
    })
    .from(quiz)
    .innerJoin(course, eq(quiz.courseId, course.id))
    .where(eq(quiz.status, "published"));

  // Filter to only the student's courses
  const filtered = quizzes.filter((q) => courseIds.includes(q.courseId));

  return NextResponse.json(filtered);
}
