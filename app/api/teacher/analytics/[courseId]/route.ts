import { NextResponse } from "next/server";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { getCourseAnalytics } from "@/lib/adaptive/analytics-engine";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";

/**
 * GET /api/teacher/analytics/[courseId]
 * Returns class-wide CO attainment, at-risk students, and aggregate stats.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error } = await teacherGuard();
  if (error) return error;

  const { courseId } = await params;
  const analytics = await getCourseAnalytics(courseId);

  // Resolve at-risk student names
  const atRiskWithNames = await Promise.all(
    analytics.atRiskStudents.map(async (s) => {
      const [u] = await db
        .select({ name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, s.userId));
      return { ...s, name: u?.name ?? "Unknown", email: u?.email ?? "" };
    })
  );

  return NextResponse.json({
    ...analytics,
    atRiskStudents: atRiskWithNames,
  });
}
