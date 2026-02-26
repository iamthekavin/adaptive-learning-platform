import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { program } from "@/lib/db/schema/academic";
import { adminGuard } from "@/lib/admin/auth-guard";
import { updateProgramSchema } from "@/lib/admin/validators";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const [data] = await db.select().from(program).where(eq(program.id, id));
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateProgramSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(program)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(program.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await adminGuard();
  if (error) return error;

  const { id } = await params;
  const [deleted] = await db.delete(program).where(eq(program.id, id)).returning();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
