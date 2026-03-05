import { db } from "@/lib/db";
import { proctorEvent } from "@/lib/db/schema/proctoring";
import { studentAnswer, question, quizSession } from "@/lib/db/schema/assessment";
import { eq, and } from "drizzle-orm";

/**
 * Compute risk score from proctoring events and answer patterns.
 * Returns 0–100 score. Flagged if ≥ 25.
 */
export async function computeRiskScore(sessionId: string): Promise<{ riskScore: number; flagged: boolean }> {
  // Get proctor events
  const events = await db
    .select()
    .from(proctorEvent)
    .where(eq(proctorEvent.sessionId, sessionId));

  let riskScore = 0;

  // Tab switches: +10 each
  const tabSwitches = events.filter((e) => e.eventType === "tab_switch" || e.eventType === "blur");
  riskScore += tabSwitches.length * 10;

  // Copy attempts: +15 each
  const copyAttempts = events.filter((e) => e.eventType === "copy_attempt");
  riskScore += copyAttempts.length * 15;

  // Rapid answer pattern: check if many answers were submitted in < 3s
  const answers = await db
    .select()
    .from(studentAnswer)
    .where(eq(studentAnswer.sessionId, sessionId));

  const rapidAnswers = answers.filter((a) => a.timeTakenSeconds !== null && a.timeTakenSeconds < 3);
  if (rapidAnswers.length >= 3) {
    riskScore += 15; // Suspicious rapid answering pattern
  }

  // Cap at 100
  riskScore = Math.min(riskScore, 100);
  const flagged = riskScore >= 25;

  // Update session
  await db
    .update(quizSession)
    .set({ riskScore, flagged })
    .where(eq(quizSession.id, sessionId));

  return { riskScore, flagged };
}
