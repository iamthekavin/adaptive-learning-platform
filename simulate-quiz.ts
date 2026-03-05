import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { db } from "./lib/db";
import { user } from "./lib/db/schema/auth";
import { question, studentAnswer, quizSession, quiz } from "./lib/db/schema/assessment";
import { courseOutcome } from "./lib/db/schema/course";
import { coMastery } from "./lib/db/schema/adaptive";
import { computeCOMastery } from "./lib/adaptive/analytics-engine";
import { eq, sql, and } from "drizzle-orm";

async function main() {
  const admin = await db.select().from(user).where(eq(user.role, "admin")).limit(1);
  const student = await db.select().from(user).where(eq(user.email, "kamal082006@gmail.com")).limit(1);
  if (!student[0] || !admin[0]) return console.log("Users missing");

  // 1. Pick a course that has COs
  const cos = await db.select().from(courseOutcome).limit(1);
  if (!cos[0]) return console.log("No COs found in DB");
  const courseId = cos[0].courseId;
  const coId = cos[0].id;

  // 2. See if there is a quiz
  let tests = await db.select().from(quiz).where(eq(quiz.courseId, courseId)).limit(1);
  if (!tests[0]) {
    console.log("No quiz found, creating one");
    const [q] = await db.insert(quiz).values({
      courseId, createdBy: admin[0].id, title: "Test Quiz", description: "test", 
      totalMarks: 10, status: "published", durationMinutes: 10
    }).returning();
    tests = [q];
  }
  const qz = tests[0];

  // 3. Ensure a question exists
  let qs = await db.select().from(question).where(eq(question.quizId, qz.id)).limit(1);
  if (!qs[0]) {
    console.log("No question found, creating one");
    const [q] = await db.insert(question).values({
      quizId: qz.id, courseOutcomeId: coId, text: "Q1", marks: 10, difficulty: "easy"
    }).returning();
    qs = [q];
  }
  const quest = qs[0];

  // 4. Create a quiz_session and student_answer
  console.log("Creating session");
  const [sess] = await db.insert(quizSession).values({
    userId: student[0].id, quizId: qz.id, status: "submitted", score: 10, totalMarks: 10
  }).returning();

  console.log("Inserting answer");
  await db.insert(studentAnswer).values({
    sessionId: sess.id, questionId: quest.id, selectedOptionId: "dummy", isCorrect: true, timeTakenSeconds: 30
  });

  // 5. Run computeCOMastery
  console.log("Running computeCOMastery");
  try {
    await computeCOMastery(student[0].id, courseId);
    console.log("SUCCESS");
  } catch (err: any) {
    console.error("ERROR in computeCOMastery:", err.message);
  }

  // 6. Check if coMastery has data
  const mastery = await db.select().from(coMastery).where(eq(coMastery.userId, student[0].id));
  console.log("CO Mastery Results:", mastery);
  process.exit(0);
}

main().catch(err => { console.error("FATAL ERROR:", err); process.exit(1); });
