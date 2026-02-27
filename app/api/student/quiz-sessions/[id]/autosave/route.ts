import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizSession, studentAnswer } from "@/lib/db/schema/assessment";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const autosaveSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionId: z.string().min(1),
  timeTakenSeconds: z.number().int().min(0).optional(),
});

/**
 * POST /api/student/quiz-sessions/[id]/autosave
 * Autosaves a single answer during a quiz attempt.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await studentGuard();
  if (error) return error;

  const { id: sessionId } = await params;
  const userId = session!.user.id;

  const body = await req.json();
  const parsed = autosaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { questionId, selectedOptionId, timeTakenSeconds } = parsed.data;

  // Verify session belongs to this user and is in progress
  const [qs] = await db
    .select()
    .from(quizSession)
    .where(
      and(
        eq(quizSession.id, sessionId),
        eq(quizSession.userId, userId),
        eq(quizSession.status, "in_progress")
      )
    );

  if (!qs) {
    return NextResponse.json({ error: "Session not found or already submitted" }, { status: 404 });
  }

  // Upsert the answer
  await db
    .insert(studentAnswer)
    .values({
      sessionId,
      questionId,
      selectedOptionId,
      timeTakenSeconds: timeTakenSeconds ?? null,
    })
    .onConflictDoUpdate({
      target: [studentAnswer.sessionId, studentAnswer.questionId],
      set: {
        selectedOptionId,
        timeTakenSeconds: timeTakenSeconds ?? null,
      },
    });

  return NextResponse.json({ success: true });
}
