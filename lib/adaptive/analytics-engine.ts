import { db } from "@/lib/db";
import { studentAnswer, question, quizSession, quiz } from "@/lib/db/schema/assessment";
import { courseOutcome } from "@/lib/db/schema/course";
import { coMastery } from "@/lib/db/schema/adaptive";
import { eq, and, sql } from "drizzle-orm";

/**
 * Mastery-level classification
 */
function masteryLevel(pct: number): string {
  if (pct >= 90) return "mastered";
  if (pct >= 70) return "proficient";
  if (pct >= 40) return "developing";
  return "weak";
}

/**
 * Recompute CO mastery for a student on a specific course.
 * Aggregates all student answers on questions tagged with COs from this course.
 */
export async function computeCOMastery(userId: string, courseId: string) {
  // Get all COs for this course
  const cos = await db
    .select()
    .from(courseOutcome)
    .where(eq(courseOutcome.courseId, courseId));

  if (cos.length === 0) return;

  // Get all student answers for questions tagged to these COs
  for (const co of cos) {
    const results = await db
      .select({
        total: sql<number>`count(*)`.as("total"),
        correct: sql<number>`sum(case when ${studentAnswer.isCorrect} = true then 1 else 0 end)`.as("correct"),
      })
      .from(studentAnswer)
      .innerJoin(question, eq(studentAnswer.questionId, question.id))
      .where(
        and(
          eq(question.courseOutcomeId, co.id),
          sql`${studentAnswer.sessionId} IN (
            SELECT qs.id FROM quiz_session qs
            WHERE qs.user_id = ${userId} AND qs.status = 'submitted'
          )`
        )
      );

    const total = Number(results[0]?.total ?? 0);
    const correct = Number(results[0]?.correct ?? 0);
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const level = masteryLevel(pct);

    // Upsert coMastery
    const [existing] = await db
      .select()
      .from(coMastery)
      .where(
        and(
          eq(coMastery.userId, userId),
          eq(coMastery.courseOutcomeId, co.id)
        )
      );

    if (existing) {
      await db
        .update(coMastery)
        .set({
          totalQuestions: total,
          correctAnswers: correct,
          masteryPct: pct,
          level,
          lastUpdated: new Date(),
        })
        .where(eq(coMastery.id, existing.id));
    } else if (total > 0) {
      await db.insert(coMastery).values({
        userId,
        courseOutcomeId: co.id,
        totalQuestions: total,
        correctAnswers: correct,
        masteryPct: pct,
        level,
      });
    }
  }
}

/**
 * Get student insights for a specific course.
 * Returns CO mastery breakdown and difficulty performance.
 */
export async function getStudentInsights(userId: string, courseId: string) {
  // CO mastery data
  const cos = await db
    .select()
    .from(courseOutcome)
    .where(eq(courseOutcome.courseId, courseId));

  const coIds = cos.map((c) => c.id);

  const masteryData = coIds.length > 0
    ? await db
        .select()
        .from(coMastery)
        .where(
          and(
            eq(coMastery.userId, userId),
            sql`${coMastery.courseOutcomeId} IN (${sql.join(coIds.map(id => sql`${id}`), sql`, `)})`
          )
        )
    : [];

  // Difficulty breakdown
  const difficultyStats = await db
    .select({
      difficulty: question.difficulty,
      total: sql<number>`count(*)`.as("total"),
      correct: sql<number>`sum(case when ${studentAnswer.isCorrect} = true then 1 else 0 end)`.as("correct"),
    })
    .from(studentAnswer)
    .innerJoin(question, eq(studentAnswer.questionId, question.id))
    .innerJoin(courseOutcome, eq(question.courseOutcomeId, courseOutcome.id))
    .where(
      and(
        eq(courseOutcome.courseId, courseId),
        sql`${studentAnswer.sessionId} IN (
          SELECT qs.id FROM quiz_session qs
          WHERE qs.user_id = ${userId} AND qs.status = 'submitted'
        )`
      )
    )
    .groupBy(question.difficulty);

  // Build CO insights
  const coInsights = cos.map((co) => {
    const m = masteryData.find((md) => md.courseOutcomeId === co.id);
    return {
      coId: co.id,
      coCode: co.code,
      coDescription: co.description,
      totalQuestions: m?.totalQuestions ?? 0,
      correctAnswers: m?.correctAnswers ?? 0,
      masteryPct: m?.masteryPct ?? 0,
      level: m?.level ?? "weak",
    };
  });

  // Recommendations
  const weakCOs = coInsights.filter((c) => c.level === "weak" || c.level === "developing");
  const recommendations = weakCOs.map((c) => ({
    coCode: c.coCode,
    coDescription: c.coDescription,
    level: c.level,
    message: c.level === "weak"
      ? `Focus on ${c.coCode}: ${c.coDescription}. You scored ${c.masteryPct}%.` 
      : `Keep practicing ${c.coCode}: ${c.coDescription}. You're at ${c.masteryPct}%.`,
  }));

  return {
    coInsights,
    difficultyBreakdown: difficultyStats.map((d) => ({
      difficulty: d.difficulty,
      total: Number(d.total),
      correct: Number(d.correct),
      pct: Number(d.total) > 0 ? Math.round((Number(d.correct) / Number(d.total)) * 100) : 0,
    })),
    recommendations,
    overallMastery: coInsights.length > 0
      ? Math.round(coInsights.reduce((sum, c) => sum + c.masteryPct, 0) / coInsights.length)
      : 0,
  };
}

/**
 * Get class-wide analytics for a course (teacher view).
 *
 * - totalStudents / atRiskStudents: computed from quiz sessions — NO CO dependency.
 * - coAnalytics: CO-level breakdown, only populated when COs + tagged questions exist.
 */
export async function getCourseAnalytics(courseId: string) {
  // ── 1. Per-student score across all submitted sessions for this course ──
  // A quiz belongs to the course directly via quiz.courseId.
  const sessionStats = await db
    .select({
      userId: quizSession.userId,
      totalMarks: sql<number>`sum(${quizSession.totalMarks})`.as("total_marks"),
      score: sql<number>`sum(${quizSession.score})`.as("score"),
    })
    .from(quizSession)
    .innerJoin(quiz, eq(quizSession.quizId, quiz.id))
    .where(
      and(
        eq(quiz.courseId, courseId),
        eq(quizSession.status, "submitted")
      )
    )
    .groupBy(quizSession.userId);

  const totalStudents = sessionStats.length;

  // At-risk: overall score pct < 40%
  const atRiskStudents = sessionStats
    .map((s) => {
      const marks = Number(s.totalMarks);
      const pct = marks > 0 ? Math.round((Number(s.score) / marks) * 100) : 0;
      return { userId: s.userId, avgMastery: pct };
    })
    .filter((s) => s.avgMastery < 40);

  // ── 2. CO-level analytics (only if COs + CO-tagged questions exist) ────
  const cos = await db
    .select()
    .from(courseOutcome)
    .where(eq(courseOutcome.courseId, courseId));

  const coIds = cos.map((c) => c.id);

  let coAnalytics: {
    coId: string;
    coCode: string;
    coDescription: string;
    avgMastery: number;
    studentCount: number;
    weakCount: number;
    developingCount: number;
    proficientCount: number;
    masteredCount: number;
  }[] = [];

  if (coIds.length > 0) {
    // Per-student, per-CO performance from raw answers
    const perStudentCO = await db
      .select({
        userId: quizSession.userId,
        courseOutcomeId: question.courseOutcomeId,
        total: sql<number>`count(${studentAnswer.id})`.as("total"),
        correct: sql<number>`sum(case when ${studentAnswer.isCorrect} = true then 1 else 0 end)`.as("correct"),
      })
      .from(studentAnswer)
      .innerJoin(quizSession, eq(studentAnswer.sessionId, quizSession.id))
      .innerJoin(question, eq(studentAnswer.questionId, question.id))
      .where(
        and(
          eq(quizSession.status, "submitted"),
          sql`${question.courseOutcomeId} IN (${sql.join(coIds.map((id) => sql`${id}`), sql`, `)})`
        )
      )
      .groupBy(quizSession.userId, question.courseOutcomeId);

    const studentCOMastery = perStudentCO.map((row) => {
      const total = Number(row.total);
      const correct = Number(row.correct);
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        userId: row.userId,
        courseOutcomeId: row.courseOutcomeId as string,
        pct,
        level: masteryLevel(pct),
      };
    });

    coAnalytics = cos.map((co) => {
      const rows = studentCOMastery.filter((r) => r.courseOutcomeId === co.id);
      if (rows.length === 0) {
        return {
          coId: co.id,
          coCode: co.code,
          coDescription: co.description,
          avgMastery: 0,
          studentCount: 0,
          weakCount: 0,
          developingCount: 0,
          proficientCount: 0,
          masteredCount: 0,
        };
      }
      return {
        coId: co.id,
        coCode: co.code,
        coDescription: co.description,
        avgMastery: Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length),
        studentCount: rows.length,
        weakCount: rows.filter((r) => r.level === "weak").length,
        developingCount: rows.filter((r) => r.level === "developing").length,
        proficientCount: rows.filter((r) => r.level === "proficient").length,
        masteredCount: rows.filter((r) => r.level === "mastered").length,
      };
    });
  }

  return { coAnalytics, atRiskStudents, totalStudents };
}


