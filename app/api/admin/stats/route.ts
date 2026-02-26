import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminGuard } from "@/lib/admin/auth-guard";
import { user } from "@/lib/db/schema/auth";
import { department, program } from "@/lib/db/schema/academic";
import { course } from "@/lib/db/schema/course";
import { studentEnrollment } from "@/lib/db/schema/enrollment";
import { quiz } from "@/lib/db/schema/assessment";
import { sql, eq } from "drizzle-orm";

/**
 * GET /api/admin/stats
 * Platform-wide statistics for the admin dashboard.
 */
export async function GET() {
  const { error } = await adminGuard();
  if (error) return error;

  const [
    [userCount],
    [teacherCount],
    [studentCount],
    [deptCount],
    [progCount],
    [courseCount],
    [enrollActive],
    [enrollTotal],
    [quizPublished],
    [quizDraft],
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(user),
    db.select({ count: sql<number>`count(*)` }).from(user).where(eq(user.role, "teacher")),
    db.select({ count: sql<number>`count(*)` }).from(user).where(eq(user.role, "student")),
    db.select({ count: sql<number>`count(*)` }).from(department),
    db.select({ count: sql<number>`count(*)` }).from(program),
    db.select({ count: sql<number>`count(*)` }).from(course),
    db.select({ count: sql<number>`count(*)` }).from(studentEnrollment).where(eq(studentEnrollment.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(studentEnrollment),
    db.select({ count: sql<number>`count(*)` }).from(quiz).where(eq(quiz.status, "published")),
    db.select({ count: sql<number>`count(*)` }).from(quiz).where(eq(quiz.status, "draft")),
  ]);

  return NextResponse.json({
    totalUsers: Number(userCount?.count ?? 0),
    teachers: Number(teacherCount?.count ?? 0),
    students: Number(studentCount?.count ?? 0),
    departments: Number(deptCount?.count ?? 0),
    programs: Number(progCount?.count ?? 0),
    courses: Number(courseCount?.count ?? 0),
    activeEnrollments: Number(enrollActive?.count ?? 0),
    totalEnrollments: Number(enrollTotal?.count ?? 0),
    publishedQuizzes: Number(quizPublished?.count ?? 0),
    draftQuizzes: Number(quizDraft?.count ?? 0),
  });
}
