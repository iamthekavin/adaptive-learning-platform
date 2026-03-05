import { NextResponse } from "next/server";
import { getStudentInsights } from "@/lib/adaptive/analytics-engine";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { course, courseOutcome } from "@/lib/db/schema/course";
import { coMastery } from "@/lib/db/schema/adaptive";

export async function GET() {
  try {
    const student = await db.select().from(user).where(eq(user.email, "kamal082006@gmail.com")).limit(1);
    if (!student[0]) return NextResponse.json({ error: "Student not found" });
    
    const crs = await db.select().from(course).limit(1);
    if (!crs[0]) return NextResponse.json({ error: "Course not found" });

    const cos = await db.select().from(courseOutcome).limit(1);
    if (cos[0]) {
      const existing = await db.select().from(coMastery).where(eq(coMastery.userId, student[0].id));
      if (existing.length === 0) {
        await db.insert(coMastery).values({
          userId: student[0].id,
          courseOutcomeId: cos[0].id,
          totalQuestions: 10,
          correctAnswers: 5,
          masteryPct: 50,
          level: "developing"
        });
      }
    }

    const result = await getStudentInsights(student[0].id, crs[0].id);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack, cause: err.cause ? err.cause.message || err.cause : null });
  }
}
