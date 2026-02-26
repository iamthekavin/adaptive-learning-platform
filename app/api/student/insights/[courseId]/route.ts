import { NextResponse } from "next/server";
import { studentGuard } from "@/lib/student/auth-guard";
import { getStudentInsights } from "@/lib/adaptive/analytics-engine";

/**
 * GET /api/student/insights/[courseId]
 * Returns CO mastery breakdown, difficulty performance, and recommendations.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { error, session } = await studentGuard();
  if (error) return error;

  const { courseId } = await params;
  const insights = await getStudentInsights(session!.user.id, courseId);

  return NextResponse.json(insights);
}
