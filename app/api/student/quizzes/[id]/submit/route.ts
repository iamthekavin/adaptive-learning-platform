import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz, question, option, quizSession, studentAnswer } from "@/lib/db/schema/assessment";
import { studentGuard } from "@/lib/student/auth-guard";
import { computeCOMastery } from "@/lib/adaptive/analytics-engine";
import { computeRiskScore } from "@/lib/adaptive/risk-engine";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const submitSchema = z.object({
  sessionId: z.string().min(1),
  answers: z.array(z.object({
    questionId: z.string().min(1),
    selectedOptionId: z.string().min(1),
    timeTakenSeconds: z.number().int().min(0).optional(),
  })),
});

/**
 * POST /api/student/quizzes/[id]/submit
 * Submit quiz answers — auto-grades and returns score.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await studentGuard();
  if (error) return error;

  const { id: quizId } = await params;
  const userId = session!.user.id;

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sessionId, answers } = parsed.data;

  // Verify session belongs to this user and is in progress
  const [qs] = await db
    .select()
    .from(quizSession)
    .where(
      and(
        eq(quizSession.id, sessionId),
        eq(quizSession.userId, userId),
        eq(quizSession.quizId, quizId),
        eq(quizSession.status, "in_progress")
      )
    );

  if (!qs) {
    return NextResponse.json({ error: "Session not found or already submitted" }, { status: 404 });
  }

  // Server-side timer enforcement: duration + 60s grace period
  const [quizInfo] = await db.select().from(quiz).where(eq(quiz.id, quizId));
  if (quizInfo) {
    const deadline = new Date(qs.startedAt.getTime() + (quizInfo.durationMinutes + 1) * 60 * 1000);
    if (new Date() > deadline) {
      return NextResponse.json({ error: "Time limit exceeded" }, { status: 400 });
    }
  }

  // Get all questions and their correct options for grading
  const questions = await db.select().from(question).where(eq(question.quizId, quizId));
  const allOptions = await db.select().from(option);

  let totalScore = 0;

  // Insert answers and grade
  const answerRecords = answers.map((a) => {
    const q = questions.find((q) => q.id === a.questionId);
    const selectedOpt = allOptions.find((o) => o.id === a.selectedOptionId);
    const isCorrect = selectedOpt?.isCorrect ?? false;

    if (isCorrect && q) totalScore += q.marks;

    return {
      sessionId,
      questionId: a.questionId,
      selectedOptionId: a.selectedOptionId,
      isCorrect,
      timeTakenSeconds: a.timeTakenSeconds ?? null,
    };
  });

  if (answerRecords.length > 0) {
    await db.insert(studentAnswer).values(answerRecords);
  }

  // Update session
  const [updatedSession] = await db
    .update(quizSession)
    .set({
      status: "submitted",
      score: totalScore,
      submittedAt: new Date(),
    })
    .where(eq(quizSession.id, sessionId))
    .returning();

  // Recompute CO mastery and risk score after submission
  const [quizData] = await db.select().from(quiz).where(eq(quiz.id, quizId));
  if (quizData) {
    computeCOMastery(userId, quizData.courseId).catch(() => {});
  }
  computeRiskScore(sessionId).catch(() => {});

  return NextResponse.json({
    score: totalScore,
    totalMarks: qs.totalMarks,
    percentage: qs.totalMarks ? Math.round((totalScore / qs.totalMarks) * 100) : 0,
    session: updatedSession,
  });
}
