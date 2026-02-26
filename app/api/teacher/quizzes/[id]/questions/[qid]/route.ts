import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz, question, option } from "@/lib/db/schema/assessment";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { updateQuestionSchema } from "@/lib/admin/validators";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id, qid } = await params;

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
  const parsed = updateQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { options: optionsData, ...questionData } = parsed.data;

  // Get current question to see if marks changed
  const [currentQ] = await db
    .select()
    .from(question)
    .where(and(eq(question.id, qid), eq(question.quizId, id)));

  if (!currentQ) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const [updated] = await db
    .update(question)
    .set({ ...questionData, updatedAt: new Date() })
    .where(and(eq(question.id, qid), eq(question.quizId, id)))
    .returning();

  // If options were provided, replace them all
  if (optionsData) {
    await db.delete(option).where(eq(option.questionId, qid));
    await db.insert(option).values(
      optionsData.map((o, i) => ({
        text: o.text,
        isCorrect: o.isCorrect,
        questionId: qid,
        orderIndex: i,
      }))
    );
  }

  // Update quiz totalMarks if marks changed
  if (questionData.marks !== undefined && questionData.marks !== currentQ.marks) {
    const markDiff = questionData.marks - currentQ.marks;
    await db
      .update(quiz)
      .set({
        totalMarks: Math.max(0, q.totalMarks + markDiff),
        updatedAt: new Date(),
      })
      .where(eq(quiz.id, id));
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; qid: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id, qid } = await params;

  // Verify quiz ownership
  const [q] = await db
    .select()
    .from(quiz)
    .where(and(eq(quiz.id, id), eq(quiz.createdBy, session!.user.id)));
  if (!q) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (q.status === "published") {
    return NextResponse.json({ error: "Cannot modify a published quiz" }, { status: 400 });
  }

  // Get question marks before deleting
  const [deletedQ] = await db
    .delete(question)
    .where(and(eq(question.id, qid), eq(question.quizId, id)))
    .returning();

  if (!deletedQ) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  // Options cascade-deleted. Update totalMarks.
  await db
    .update(quiz)
    .set({
      totalMarks: Math.max(0, q.totalMarks - deletedQ.marks),
      updatedAt: new Date(),
    })
    .where(eq(quiz.id, id));

  return NextResponse.json({ success: true });
}
