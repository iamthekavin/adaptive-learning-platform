import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proctorEvent } from "@/lib/db/schema/proctoring";
import { quizSession } from "@/lib/db/schema/assessment";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const proctorSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.enum(["tab_switch", "blur", "focus", "copy_attempt"]),
  metadata: z.string().optional(),
});

/**
 * POST /api/student/quizzes/[id]/proctor
 * Log a proctoring event during a quiz session.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await studentGuard();
  if (error) return error;

  const body = await req.json();
  const parsed = proctorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify session belongs to this user and is in progress
  const [qs] = await db
    .select()
    .from(quizSession)
    .where(
      and(
        eq(quizSession.id, parsed.data.sessionId),
        eq(quizSession.userId, session!.user.id),
        eq(quizSession.status, "in_progress")
      )
    );

  if (!qs) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [created] = await db
    .insert(proctorEvent)
    .values({
      sessionId: parsed.data.sessionId,
      eventType: parsed.data.eventType,
      metadata: parsed.data.metadata ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
