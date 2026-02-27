import { db } from "@/lib/db";
import { question, studentAnswer, quizSession } from "@/lib/db/schema/assessment";
import { coMastery } from "@/lib/db/schema/adaptive";
import { eq, and, notInArray, asc, sql } from "drizzle-orm";

/**
 * Gets the next most appropriate question for a student in an adaptive quiz session.
 * 
 * Logic:
 * 1. Find the question whose `eloRating` is closest to the student's `eloRating` for the question's CO.
 * 2. Ensure the question belongs to this quiz/course.
 * 3. Ensure the student hasn't already answered it in the current session.
 */
export async function getNextAdaptiveQuestion(sessionId: string, quizId: string, userId: string) {
  // 1. Get answered questions in this session
  const answered = await db
    .select({ questionId: studentAnswer.questionId })
    .from(studentAnswer)
    .where(eq(studentAnswer.sessionId, sessionId));

  const answeredIds = answered.map(a => a.questionId);

  // 2. Get available questions for this quiz
  let availableQuestionsQuery = db
    .select()
    .from(question)
    .where(
        eq(question.quizId, quizId)
    );

  const availableQuestions = await availableQuestionsQuery;

  // Filter out already answered
  const unattempted = availableQuestions.filter(q => !answeredIds.includes(q.id));

  if (unattempted.length === 0) {
    return null; // Quiz complete
  }

  // 3. Get student's current Elo ratings for all related COs
  const coIds = [...new Set(unattempted.map(q => q.courseOutcomeId).filter(Boolean) as string[])];
  
  let studentElos: Record<string, number> = {};

  if (coIds.length > 0) {
    const masteryRecords = await db
      .select({ courseOutcomeId: coMastery.courseOutcomeId, eloRating: coMastery.eloRating })
      .from(coMastery)
      .where(
        and(
          eq(coMastery.userId, userId),
          sql`${coMastery.courseOutcomeId} IN (${sql.join(coIds.map(id => sql`${id}`), sql`, `)})`
        )
      );
    
    masteryRecords.forEach(m => {
      studentElos[m.courseOutcomeId] = m.eloRating;
    });
  }

  // 4. Find the question with Elo closest to the student's Elo for that CO
  // If CO has no mastery record, default to 1200
  let bestQuestion = unattempted[0];
  let minDifference = Infinity;

  for (const q of unattempted) {
    const studentElo = q.courseOutcomeId ? (studentElos[q.courseOutcomeId] ?? 1200) : 1200;
    const diff = Math.abs(q.eloRating - studentElo);

    if (diff < minDifference) {
      minDifference = diff;
      bestQuestion = q;
    }
  }

  return bestQuestion;
}
