import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { courseUnit, unitTopic } from "@/lib/db/schema/course";
import { teacherGuard } from "@/lib/teacher/auth-guard";
import { eq } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { error } = await teacherGuard();
    if (error) return error;

    const { courseId } = await params;

    // Fetch all units for the course
    const units = await db.query.courseUnit.findMany({
      where: eq(courseUnit.courseId, courseId),
      orderBy: (units, { asc }) => [asc(units.unitNumber)],
    });

    // Fetch all topics for those units
    const unitIds = units.map((u) => u.id);
    let topics: any[] = [];
    
    if (unitIds.length > 0) {
      topics = await db.query.unitTopic.findMany({
        where: (t, { inArray }) => inArray(t.unitId, unitIds),
      });
    }

    return NextResponse.json({ units, topics });
  } catch (err: any) {
    console.error("Fetch Syllabus Error:", err);
    return NextResponse.json({ error: "Failed to fetch syllabus" }, { status: 500 });
  }
}
