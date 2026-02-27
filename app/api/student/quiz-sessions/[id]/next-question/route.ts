import { NextResponse } from "next/server";
import { studentGuard } from "@/lib/student/auth-guard";
import { getNextAdaptiveQuestion } from "@/lib/adaptive/sequencing-engine";
import { db } from "@/lib/db";
import { quizSession, option } from "@/lib/db/schema/assessment";
import { eq, sql } from "drizzle-orm";

/**
 * GET /api/student/quiz-sessions/[id]/next-question
 * Fetches the next best question for an adaptive quiz session.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await studentGuard();
  if (error) return error;

  const { id: sessionId } = await params;
  const userId = session!.user.id;

  // Verify session
  const [qs] = await db
    .select()
    .from(quizSession)
    .where(sql`${quizSession.id} = ${sessionId} AND ${quizSession.userId} = ${userId}`);

  if (!qs) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (qs.status !== "in_progress") {
    return NextResponse.json({ error: "Session is not active" }, { status: 400 });
  }

  const nextQuestion = await getNextAdaptiveQuestion(qs.id, qs.quizId, userId);

  if (!nextQuestion) {
     return NextResponse.json({ message: "No more questions available for this course. Quiz complete." });
  }

  // Fetch options for the question
  const options = await db
     .select({
       id: option.id,
       text: option.text,
       orderIndex: option.orderIndex
     })
     .from(option)
     .where(eq(option.questionId, nextQuestion.id));

  return NextResponse.json({
    question: {
      id: nextQuestion.id,
      text: nextQuestion.text,
      marks: nextQuestion.marks,
      options: options.sort((a,b) => a.orderIndex - b.orderIndex)
    }
  });
}
