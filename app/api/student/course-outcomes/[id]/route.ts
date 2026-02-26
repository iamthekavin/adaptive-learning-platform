import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseOutcome } from "@/lib/db/schema/course";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq } from "drizzle-orm";

/**
 * GET /api/student/course-outcomes/[id]
 * Returns course outcomes for a given course ID.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await studentGuard();
  if (error) return error;

  const { id } = await params;
  const outcomes = await db
    .select()
    .from(courseOutcome)
    .where(eq(courseOutcome.courseId, id));

  return NextResponse.json(outcomes);
}
