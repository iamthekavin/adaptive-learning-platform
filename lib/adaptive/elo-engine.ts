import { db } from "@/lib/db";
import { coMastery } from "@/lib/db/schema/adaptive";
import { question } from "@/lib/db/schema/assessment";
import { eq, and } from "drizzle-orm";

const K_FACTOR = 32;

/**
 * Calculate expected score (probability of winning)
 * 1 = win, 0 = loss
 */
export function calculateExpectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates new Elo ratings based on correctness
 * 
 * @param studentElo The student's current Elo for this CO
 * @param questionElo The question's current Elo
 * @param isCorrect Whether the student answered correctly
 * @returns { newStudentElo, newQuestionElo }
 */
export function calculateNewElos(studentElo: number, questionElo: number, isCorrect: boolean) {
  const actualScore = isCorrect ? 1 : 0;
  
  const studentExpected = calculateExpectedScore(studentElo, questionElo);
  const questionExpected = calculateExpectedScore(questionElo, studentElo);

  const newStudentElo = Math.round(studentElo + K_FACTOR * (actualScore - studentExpected));
  const newQuestionElo = Math.round(questionElo + K_FACTOR * ((1 - actualScore) - questionExpected));

  return {
    newStudentElo: Math.max(100, newStudentElo), // Floor rating at 100
    newQuestionElo: Math.max(100, newQuestionElo), 
  };
}

/**
 * Updates the Elo ratings in the database after a question is answered
 */
export async function updateElos(
  userId: string, 
  courseOutcomeId: string | null, 
  questionId: string, 
  isCorrect: boolean
) {
  if (!courseOutcomeId) return; // Cannot adapt without mapped CO

  // 1. Get current ratings
  const [qData] = await db.select({ eloRating: question.eloRating }).from(question).where(eq(question.id, questionId));
  const [coData] = await db.select({ eloRating: coMastery.eloRating, id: coMastery.id }).from(coMastery).where(and(eq(coMastery.userId, userId), eq(coMastery.courseOutcomeId, courseOutcomeId)));
  
  if (!qData) return;

  const currentQuestionElo = qData.eloRating;
  // If no mastery record exists yet, default to 1200
  const currentStudentElo = coData?.eloRating ?? 1200;

  // 2. Calculate new Elos
  const { newStudentElo, newQuestionElo } = calculateNewElos(currentStudentElo, currentQuestionElo, isCorrect);

  // 3. Update DB
  await db.update(question).set({ eloRating: newQuestionElo }).where(eq(question.id, questionId));

  if (coData) {
    await db.update(coMastery).set({ eloRating: newStudentElo }).where(eq(coMastery.id, coData.id));
  } else {
    // Should theoretically be created by analytics-engine, but just in case
    await db.insert(coMastery).values({
      userId,
      courseOutcomeId,
      eloRating: newStudentElo,
      totalQuestions: 1,
      correctAnswers: isCorrect ? 1 : 0,
      masteryPct: isCorrect ? 100 : 0,
      level: isCorrect ? "mastered" : "weak"
    });
  }
}
