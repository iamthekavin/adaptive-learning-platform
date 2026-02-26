import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz } from "@/lib/db/schema/assessment";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { updateQuizSchema } from "@/lib/admin/validators";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id } = await params;
  const [data] = await db
    .select()
    .from(quiz)
    .where(and(eq(quiz.id, id), eq(quiz.createdBy, session!.user.id)));

  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(quiz)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(quiz.id, id), eq(quiz.createdBy, session!.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id } = await params;
  const [deleted] = await db
    .delete(quiz)
    .where(and(eq(quiz.id, id), eq(quiz.createdBy, session!.user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
