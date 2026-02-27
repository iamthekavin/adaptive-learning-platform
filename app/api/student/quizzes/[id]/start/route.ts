import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz, question, option, quizSession, studentAnswer } from "@/lib/db/schema/assessment";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * POST /api/student/quizzes/[id]/start
 * Starts a new quiz session. Returns questions without correct answer info.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await studentGuard();
  if (error) return error;

  const { id: quizId } = await params;
  const userId = session!.user.id;

  // Verify quiz exists and is published
  const [q] = await db
    .select()
    .from(quiz)
    .where(and(eq(quiz.id, quizId), eq(quiz.status, "published")));

  if (!q) {
    return NextResponse.json({ error: "Quiz not found or not published" }, { status: 404 });
  }

  // Check existing sessions with DB calculating elapsed seconds flawlessly
  const existingSessions = await db
    .select({
      session: quizSession,
      elapsedSeconds: sql`EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ${quizSession.startedAt}))`.mapWith(Number),
    })
    .from(quizSession)
    .where(and(eq(quizSession.quizId, quizId), eq(quizSession.userId, userId)));

  // Only count submitted sessions for max attempts
  const submittedCount = existingSessions.filter((s) => s.session.status === "submitted").length;

  // Check for in-progress session first
  const inProgress = existingSessions.find((s) => s.session.status === "in_progress");

  if (inProgress) {
    // If already have a submitted session and this in_progress is stale, abandon it
    if (submittedCount > 0) {
      await db
        .update(quizSession)
        .set({ status: "abandoned" })
        .where(eq(quizSession.id, inProgress.session.id));
    } else {
      // Return existing in-progress session
      const questions = await getQuestionsWithoutAnswers(quizId);
      
      const saved = await db
        .select({
          questionId: studentAnswer.questionId,
          selectedOptionId: studentAnswer.selectedOptionId,
        })
        .from(studentAnswer)
        .where(eq(studentAnswer.sessionId, inProgress.session.id));

      const savedAnswersMap = saved.reduce((acc, curr) => {
        if (curr.selectedOptionId) {
          acc[curr.questionId] = curr.selectedOptionId;
        }
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json({
        session: inProgress.session,
        questions: q.isAdaptive ? [] : questions,
        quiz: { title: q.title, durationMinutes: q.durationMinutes, totalMarks: q.totalMarks, isAdaptive: q.isAdaptive },
        elapsedSeconds: inProgress.elapsedSeconds,
        savedAnswers: savedAnswersMap,
      });
    }
  }

  if (submittedCount >= q.maxAttempts) {
    return NextResponse.json(
      { error: `Maximum attempts (${q.maxAttempts}) reached` },
      { status: 400 }
    );
  }

  // Create new session
  const [newSession] = await db
    .insert(quizSession)
    .values({ quizId, userId, totalMarks: q.totalMarks })
    .returning();

  const questions = await getQuestionsWithoutAnswers(quizId);

  return NextResponse.json({
    session: newSession,
    questions: q.isAdaptive ? [] : questions,
    quiz: { title: q.title, durationMinutes: q.durationMinutes, totalMarks: q.totalMarks, isAdaptive: q.isAdaptive },
    elapsedSeconds: 0,
  }, { status: 201 });
}

/**
 * Returns questions with options but WITHOUT isCorrect flag.
 * Shuffles question and option order for anti-cheating.
 */
async function getQuestionsWithoutAnswers(quizId: string) {
  const questions = await db
    .select()
    .from(question)
    .where(eq(question.quizId, quizId));

  const questionIds = questions.map((q) => q.id);
  const allOptions = questionIds.length > 0
    ? await db
        .select({
          id: option.id,
          text: option.text,
          questionId: option.questionId,
          orderIndex: option.orderIndex,
        })
        .from(option)
        .where(
          sql`${option.questionId} IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`
        )
    : [];

  // Shuffle array helper
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const mapped = questions.map((q) => ({
    id: q.id,
    text: q.text,
    marks: q.marks,
    difficulty: q.difficulty,
    orderIndex: q.orderIndex,
    options: shuffle(
      allOptions.filter((o) => o.questionId === q.id)
    ),
  }));

  return shuffle(mapped);
}
