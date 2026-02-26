import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { teacherAllocation } from "@/lib/db/schema/enrollment";
import { quiz, question, quizSession } from "@/lib/db/schema/assessment";
import { sql, eq } from "drizzle-orm";

/**
 * GET /api/teacher/stats
 * Teacher-specific statistics for dashboard.
 */
export async function GET() {
  const { error, session } = await teacherGuard();
  if (error) return error;
  const userId = session!.user.id;

  const [
    [allocCount],
    [quizTotal],
    [quizPublished],
    [questionCount],
    [sessionCount],
    [avgScoreResult],
    [flaggedCount],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(teacherAllocation).where(eq(teacherAllocation.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(quiz).where(eq(quiz.createdBy, userId)),
    db.select({ count: sql<number>`count(*)` }).from(quiz).where(sql`${quiz.createdBy} = ${userId} AND ${quiz.status} = 'published'`),
    db.select({ count: sql<number>`count(*)` }).from(question).innerJoin(quiz, eq(question.quizId, quiz.id)).where(eq(quiz.createdBy, userId)),
    db.select({ count: sql<number>`count(distinct ${quizSession.userId})` }).from(quizSession).innerJoin(quiz, eq(quizSession.quizId, quiz.id)).where(eq(quiz.createdBy, userId)),
    db.select({ avg: sql<number>`coalesce(round(avg(case when ${quizSession.totalMarks} > 0 then ${quizSession.score} * 100.0 / ${quizSession.totalMarks} else 0 end)), 0)` }).from(quizSession).innerJoin(quiz, eq(quizSession.quizId, quiz.id)).where(sql`${quiz.createdBy} = ${userId} AND ${quizSession.status} = 'submitted'`),
    db.select({ count: sql<number>`count(*)` }).from(quizSession).innerJoin(quiz, eq(quizSession.quizId, quiz.id)).where(sql`${quiz.createdBy} = ${userId} AND ${quizSession.flagged} = true`),
  ]);

  return NextResponse.json({
    allocatedCourses: Number(allocCount?.count ?? 0),
    totalQuizzes: Number(quizTotal?.count ?? 0),
    publishedQuizzes: Number(quizPublished?.count ?? 0),
    totalQuestions: Number(questionCount?.count ?? 0),
    totalStudents: Number(sessionCount?.count ?? 0),
    avgScore: Number(avgScoreResult?.avg ?? 0),
    flaggedSessions: Number(flaggedCount?.count ?? 0),
  });
}
