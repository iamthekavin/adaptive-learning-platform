import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studentEnrollment, batch } from "@/lib/db/schema/enrollment";
import { program, regulation } from "@/lib/db/schema/academic";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq } from "drizzle-orm";

/**
 * GET /api/student/my-enrollment
 * Returns the logged-in student's enrollment with batch, program, and regulation details.
 */
export async function GET() {
  const { error, session } = await studentGuard();
  if (error) return error;

  const userId = session!.user.id;

  const enrollments = await db
    .select({
      enrollmentId: studentEnrollment.id,
      rollNumber: studentEnrollment.rollNumber,
      currentSemester: studentEnrollment.currentSemester,
      status: studentEnrollment.status,
      batchStartYear: batch.startYear,
      batchEndYear: batch.endYear,
      programId: program.id,
      programName: program.name,
      programCode: program.code,
      regulationName: regulation.name,
      regulationCode: regulation.code,
    })
    .from(studentEnrollment)
    .innerJoin(batch, eq(studentEnrollment.batchId, batch.id))
    .innerJoin(program, eq(batch.programId, program.id))
    .innerJoin(regulation, eq(batch.regulationId, regulation.id))
    .where(eq(studentEnrollment.userId, userId));

  if (enrollments.length === 0) {
    return NextResponse.json({ error: "No enrollment found" }, { status: 404 });
  }

  return NextResponse.json(enrollments[0]);
}
