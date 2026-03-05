import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });
import { db } from "./lib/db";
import { user } from "./lib/db/schema/auth";
import { quizSession, studentAnswer } from "./lib/db/schema/assessment";
import { coMastery } from "./lib/db/schema/adaptive";
import { eq } from "drizzle-orm";

async function main() {
  const u = await db.select().from(user).where(eq(user.email, "kamal082006@gmail.com")).limit(1);
  if (!u[0]) return console.log("User not found");
  
  const userId = u[0].id;
  
  const sessions = await db.select().from(quizSession).where(eq(quizSession.userId, userId));
  const mastery = await db.select().from(coMastery).where(eq(coMastery.userId, userId));
  
  const formatted = {
    userId,
    sessions: sessions.map(s => ({ id: s.id, status: s.status, quizId: s.quizId, score: s.score })),
    masteryCount: mastery.length,
    mastery
  };
  
  console.log(JSON.stringify(formatted, null, 2));
  process.exit(0);
}

main().catch(console.error);
