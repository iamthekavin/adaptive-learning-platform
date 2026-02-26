import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studentEnrollment, batch, teacherAllocation } from "@/lib/db/schema/enrollment";
import { semesterCourseMap, course } from "@/lib/db/schema/course";
import { semester, academicYear } from "@/lib/db/schema/academic";
import { user } from "@/lib/db/schema/auth";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/student/my-courses
 * Returns courses for the student's current semester.
 * Join: studentEnrollment → batch → semesterCourseMap (matching programId)
 *       → course + semester + academicYear
 * Also resolves the teacher name via teacherAllocation.
 */
export async function GET() {
  const { error, session } = await studentGuard();
  if (error) return error;

  const userId = session!.user.id;

  // 1. Get student enrollment
  const [enrollment] = await db
    .select()
    .from(studentEnrollment)
    .where(eq(studentEnrollment.userId, userId));

  if (!enrollment) {
    return NextResponse.json([]);
  }

  // 2. Get batch to find programId
  const [studentBatch] = await db
    .select()
    .from(batch)
    .where(eq(batch.id, enrollment.batchId));

  if (!studentBatch) {
    return NextResponse.json([]);
  }

  // 3. Find semester-course mappings for the student's program
  //    We match by programId and filter by semester number matching currentSemester
  const courseMappings = await db
    .select({
      mappingId: semesterCourseMap.id,
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      credits: course.credits,
      courseType: course.type,
      description: course.description,
      semesterNumber: semester.semesterNumber,
      yearNumber: academicYear.yearNumber,
    })
    .from(semesterCourseMap)
    .innerJoin(course, eq(semesterCourseMap.courseId, course.id))
    .innerJoin(semester, eq(semesterCourseMap.semesterId, semester.id))
    .innerJoin(academicYear, eq(semester.academicYearId, academicYear.id))
    .where(
      and(
        eq(semesterCourseMap.programId, studentBatch.programId),
        eq(semester.semesterNumber, enrollment.currentSemester)
      )
    );

  // 4. For each mapping, find the teacher (if allocated)
  const result = await Promise.all(
    courseMappings.map(async (cm) => {
      const [allocation] = await db
        .select({
          teacherName: user.name,
          teacherEmail: user.email,
        })
        .from(teacherAllocation)
        .innerJoin(user, eq(teacherAllocation.userId, user.id))
        .where(eq(teacherAllocation.semesterCourseMapId, cm.mappingId));

      return {
        ...cm,
        teacherName: allocation?.teacherName ?? null,
        teacherEmail: allocation?.teacherEmail ?? null,
      };
    })
  );

  return NextResponse.json(result);
}
