import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizSession, quiz } from "@/lib/db/schema/assessment";
import { proctorEvent } from "@/lib/db/schema/proctoring";
import { course } from "@/lib/db/schema/course";
import { user } from "@/lib/db/schema/auth";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/teacher/proctoring
 * Returns flagged quiz sessions with proctor event counts and student info.
 */
export async function GET() {
  const { error } = await teacherGuard();
  if (error) return error;

  const flaggedSessions = await db
    .select({
      sessionId: quizSession.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      courseName: course.name,
      courseCode: course.code,
      studentName: user.name,
      studentEmail: user.email,
      score: quizSession.score,
      totalMarks: quizSession.totalMarks,
      riskScore: quizSession.riskScore,
      flagged: quizSession.flagged,
      startedAt: quizSession.startedAt,
      submittedAt: quizSession.submittedAt,
    })
    .from(quizSession)
    .innerJoin(quiz, eq(quizSession.quizId, quiz.id))
    .innerJoin(course, eq(quiz.courseId, course.id))
    .innerJoin(user, eq(quizSession.userId, user.id))
    .where(eq(quizSession.flagged, true));

  // Get event counts per session
  const sessionsWithCounts = await Promise.all(
    flaggedSessions.map(async (s) => {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(proctorEvent)
        .where(eq(proctorEvent.sessionId, s.sessionId));

      return {
        ...s,
        eventCount: Number(countResult?.count ?? 0),
      };
    })
  );

  return NextResponse.json(sessionsWithCounts);
}
