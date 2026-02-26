import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studentGuard } from "@/lib/student/auth-guard";
import { quiz, quizSession } from "@/lib/db/schema/assessment";
import { coMastery } from "@/lib/db/schema/adaptive";
import { sql, eq } from "drizzle-orm";

/**
 * GET /api/student/stats
 * Student-specific statistics for dashboard.
 */
export async function GET() {
  const { error, session } = await studentGuard();
  if (error) return error;
  const userId = session!.user.id;

  const [
    [quizzesTaken],
    [avgScoreResult],
    [bestScoreResult],
    [avgMasteryResult],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(quizSession).where(sql`${quizSession.userId} = ${userId} AND ${quizSession.status} = 'submitted'`),
    db.select({ avg: sql<number>`coalesce(round(avg(case when ${quizSession.totalMarks} > 0 then ${quizSession.score} * 100.0 / ${quizSession.totalMarks} else 0 end)), 0)` }).from(quizSession).where(sql`${quizSession.userId} = ${userId} AND ${quizSession.status} = 'submitted'`),
    db.select({ best: sql<number>`coalesce(max(case when ${quizSession.totalMarks} > 0 then ${quizSession.score} * 100.0 / ${quizSession.totalMarks} else 0 end), 0)` }).from(quizSession).where(sql`${quizSession.userId} = ${userId} AND ${quizSession.status} = 'submitted'`),
    db.select({ avg: sql<number>`coalesce(round(avg(${coMastery.masteryPct})), 0)` }).from(coMastery).where(eq(coMastery.userId, userId)),
  ]);

  return NextResponse.json({
    quizzesTaken: Number(quizzesTaken?.count ?? 0),
    avgScore: Number(avgScoreResult?.avg ?? 0),
    bestScore: Math.round(Number(bestScoreResult?.best ?? 0)),
    overallMastery: Number(avgMasteryResult?.avg ?? 0),
  });
}
