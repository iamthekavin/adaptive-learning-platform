import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz, question, option } from "@/lib/db/schema/assessment";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { createQuestionSchema } from "@/lib/admin/validators";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET /api/teacher/quizzes/[id]/questions — all questions with options
 * POST — add question with options (atomic)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id } = await params;

  // Verify quiz ownership
  const [q] = await db
    .select()
    .from(quiz)
    .where(and(eq(quiz.id, id), eq(quiz.createdBy, session!.user.id)));
  if (!q) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const questions = await db.select().from(question).where(eq(question.quizId, id));

  // Fetch options for all questions
  const questionIds = questions.map((q) => q.id);
  const allOptions = questionIds.length > 0
    ? await db.select().from(option).where(
        sql`${option.questionId} IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`
      )
    : [];

  const result = questions.map((q) => ({
    ...q,
    options: allOptions.filter((o) => o.questionId === q.id),
  }));

  return NextResponse.json(result);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id } = await params;

  // Verify quiz ownership
  const [q] = await db
    .select()
    .from(quiz)
    .where(and(eq(quiz.id, id), eq(quiz.createdBy, session!.user.id)));
  if (!q) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (q.status === "published") {
    return NextResponse.json({ error: "Cannot modify a published quiz" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = createQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { options: optionsData, ...questionData } = parsed.data;

  // Count existing questions for ordering
  const existingQuestions = await db.select().from(question).where(eq(question.quizId, id));

  // Insert question
  const [createdQuestion] = await db
    .insert(question)
    .values({
      ...questionData,
      quizId: id,
      orderIndex: existingQuestions.length,
    })
    .returning();

  // Insert options
  const createdOptions = await db
    .insert(option)
    .values(
      optionsData.map((o, i) => ({
        text: o.text,
        isCorrect: o.isCorrect,
        questionId: createdQuestion.id,
        orderIndex: i,
      }))
    )
    .returning();

  // Update quiz totalMarks
  await db
    .update(quiz)
    .set({
      totalMarks: q.totalMarks + createdQuestion.marks,
      updatedAt: new Date(),
    })
    .where(eq(quiz.id, id));

  return NextResponse.json(
    { ...createdQuestion, options: createdOptions },
    { status: 201 }
  );
}
