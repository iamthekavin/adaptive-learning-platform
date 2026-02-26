import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizSession, quiz } from "@/lib/db/schema/assessment";
import { course } from "@/lib/db/schema/course";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/student/quiz-sessions
 * Returns the student's past quiz sessions with scores (submitted only).
 */
export async function GET() {
  const { error, session } = await studentGuard();
  if (error) return error;

  const sessions = await db
    .select({
      sessionId: quizSession.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      courseName: course.name,
      courseCode: course.code,
      score: quizSession.score,
      totalMarks: quizSession.totalMarks,
      status: quizSession.status,
      startedAt: quizSession.startedAt,
      submittedAt: quizSession.submittedAt,
    })
    .from(quizSession)
    .innerJoin(quiz, eq(quizSession.quizId, quiz.id))
    .innerJoin(course, eq(quiz.courseId, course.id))
    .where(and(eq(quizSession.userId, session!.user.id), eq(quizSession.status, "submitted")));

  return NextResponse.json(sessions);
}
