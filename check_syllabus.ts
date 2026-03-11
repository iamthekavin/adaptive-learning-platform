import { db } from "./lib/db";
import { course, courseUnit, unitTopic } from "./lib/db/schema/course";
import { eq } from "drizzle-orm";

async function checkSyllabus() {
  const courses = await db.select().from(course);

  console.log(`Found ${courses.length} courses.`);
  for (const c of courses) {
    const units = await db.select().from(courseUnit).where(eq(courseUnit.courseId, c.id));
    console.log(`Course: ${c.name} (${c.id})`);
    console.log(`  Units: ${units.length}`);
    
    let totalTopics = 0;
    for (const u of units) {
      const topics = await db.select().from(unitTopic).where(eq(unitTopic.unitId, u.id));
      totalTopics += topics.length;
    }
    console.log(`  Topics: ${totalTopics}`);
  }
}

checkSyllabus().catch(console.error).finally(() => process.exit(0));
