import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teacherAllocation, studentEnrollment, batch } from "@/lib/db/schema/enrollment";
import { semesterCourseMap } from "@/lib/db/schema/course";
import { user } from "@/lib/db/schema/auth";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/teacher/my-courses/[id]/students
 * Returns enrolled students for a specific teacher allocation.
 * [id] = teacherAllocation.id
 *
 * Join path: teacherAllocation → semesterCourseMap → (programId)
 *            batch (where batch.programId matches) → studentEnrollment → user
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const { id } = await params;
  const userId = session!.user.id;

  // 1. Verify the allocation belongs to this teacher
  const [allocation] = await db
    .select()
    .from(teacherAllocation)
    .where(and(eq(teacherAllocation.id, id), eq(teacherAllocation.userId, userId)));

  if (!allocation) {
    return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
  }

  // 2. Get the semester-course mapping to find the program
  const [mapping] = await db
    .select()
    .from(semesterCourseMap)
    .where(eq(semesterCourseMap.id, allocation.semesterCourseMapId));

  if (!mapping) {
    return NextResponse.json({ error: "Course mapping not found" }, { status: 404 });
  }

  // 3. Get enrolled students via batch → studentEnrollment → user
  const students = await db
    .select({
      enrollmentId: studentEnrollment.id,
      rollNumber: studentEnrollment.rollNumber,
      currentSemester: studentEnrollment.currentSemester,
      status: studentEnrollment.status,
      studentName: user.name,
      studentEmail: user.email,
    })
    .from(studentEnrollment)
    .innerJoin(batch, eq(studentEnrollment.batchId, batch.id))
    .innerJoin(user, eq(studentEnrollment.userId, user.id))
    .where(eq(batch.programId, mapping.programId));

  return NextResponse.json(students);
}
