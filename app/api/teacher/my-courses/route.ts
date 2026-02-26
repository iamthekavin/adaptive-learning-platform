import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teacherAllocation } from "@/lib/db/schema/enrollment";
import { semesterCourseMap, course } from "@/lib/db/schema/course";
import { semester, academicYear, program } from "@/lib/db/schema/academic";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { eq } from "drizzle-orm";

/**
 * GET /api/teacher/my-courses
 * Returns all courses allocated to the currently logged-in teacher,
 * joined with course, semester, academic year, and program details.
 */
export async function GET() {
  const { error, session } = await teacherGuard();
  if (error) return error;

  const userId = session!.user.id;

  const allocations = await db
    .select({
      allocationId: teacherAllocation.id,
      academicYearLabel: teacherAllocation.academicYearLabel,
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      credits: course.credits,
      courseType: course.type,
      semesterNumber: semester.semesterNumber,
      yearNumber: academicYear.yearNumber,
      programId: program.id,
      programName: program.name,
      programCode: program.code,
    })
    .from(teacherAllocation)
    .innerJoin(semesterCourseMap, eq(teacherAllocation.semesterCourseMapId, semesterCourseMap.id))
    .innerJoin(course, eq(semesterCourseMap.courseId, course.id))
    .innerJoin(semester, eq(semesterCourseMap.semesterId, semester.id))
    .innerJoin(academicYear, eq(semester.academicYearId, academicYear.id))
    .innerJoin(program, eq(semesterCourseMap.programId, program.id))
    .where(eq(teacherAllocation.userId, userId));

  return NextResponse.json(allocations);
}
