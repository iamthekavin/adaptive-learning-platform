import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quiz, quizSession, question } from "@/lib/db/schema/assessment";
import { coMastery } from "@/lib/db/schema/adaptive";
import { studentGuard } from "@/lib/student/auth-guard";
import { eq, asc, inArray, sql } from "drizzle-orm";
import { z } from "zod";

const generateSchema = z.object({
  courseId: z.string().min(1),
});

/**
 * POST /api/student/reinforcement/generate
 * Generates an on-the-fly reinforcement quiz based on the student's weakest COs.
 */
export async function POST(req: Request) {
  const { error, session } = await studentGuard();
  if (error) return error;

  const userId = session!.user.id;

  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { courseId } = parsed.data;

    // 1. Identify up to 2 weakest COs for this student in this course
    const weakCOs = await db
      .select({ 
        courseOutcomeId: coMastery.courseOutcomeId,
        eloRating: coMastery.eloRating 
      })
      .from(coMastery)
      .where(eq(coMastery.userId, userId))
      .orderBy(asc(coMastery.eloRating)) // Lowest Elo first
      .limit(2);

    if (weakCOs.length === 0) {
      return NextResponse.json(
        { error: "Not enough data to generate a reinforcement quiz yet. Keep practicing!" },
        { status: 400 }
      );
    }

    const targetCOIds = weakCOs.map((wc) => wc.courseOutcomeId);

    // 2. See if a generic reinforcement quiz shell exists for this course, else create it
    let [adaptiveQuiz] = await db
      .select()
      .from(quiz)
      .where(sql`${quiz.courseId} = ${courseId} AND ${quiz.isAdaptive} = true`)
      .limit(1);

    if (!adaptiveQuiz) {
      // Find a teacher to assign ownership cleanly (can just grab any creator of a quiz in this course)
      const [existingQuiz] = await db.select({ createdBy: quiz.createdBy }).from(quiz).where(eq(quiz.courseId, courseId)).limit(1);
      
      if (!existingQuiz) {
         return NextResponse.json({ error: "No course content available for reinforcement." }, { status: 400 });
      }

      [adaptiveQuiz] = await db
        .insert(quiz)
        .values({
          title: "Adaptive Reinforcement Practice",
          description: "An auto-generated practice session targeting your weak areas.",
          courseId,
          createdBy: existingQuiz.createdBy,
          durationMinutes: 15,
          maxAttempts: 999,
          isAdaptive: true,
          status: "published",
          totalMarks: 0, // Dynamic
        })
        .returning();
    }

    // 3. We don't pre-populate questions in the session for an *adaptive* quiz,
    // as sequencing-engine will pull them dynamically. We just create the session.
    
    // First, check if there's already an active one
    const [existingSession] = await db
      .select()
      .from(quizSession)
      .where(sql`${quizSession.quizId} = ${adaptiveQuiz.id} AND ${quizSession.userId} = ${userId} AND ${quizSession.status} = 'in_progress'`)
      .limit(1);

    if (existingSession) {
      return NextResponse.json({ sessionId: existingSession.id, quizId: adaptiveQuiz.id });
    }

    // Otherwise, create a new session
    const [newSession] = await db
      .insert(quizSession)
      .values({
        quizId: adaptiveQuiz.id,
        userId,
        status: "in_progress",
        totalMarks: 0, // We can't know total marks upfront for true adaptive
      })
      .returning();

    return NextResponse.json({
      sessionId: newSession.id,
      quizId: adaptiveQuiz.id,
      targetCOIds, // purely informational
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
