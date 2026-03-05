import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Client } from 'pg';

async function main() {
  const oOPScourseId = "jmkfkwytzn6rufzjg6aqbfcf"; // ID for oOPS(c++) (U23IT304)

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    
    // Get student user
    const userRes = await client.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', ['kamal082006@gmail.com']);
    if (userRes.rows.length === 0) {
      console.log("Student not found.");
      return;
    }
    const studentId = userRes.rows[0].id;

    // Get all COs for this course
    const coRes = await client.query('SELECT id, code FROM course_outcome WHERE course_id = $1', [oOPScourseId]);
    if (coRes.rows.length === 0) {
      console.log("No CourseOutcomes found for this course.");
      return;
    }

    const { createId } = require('@paralleldrive/cuid2');

    // Insert dummy mastery data for each CO
    for (const co of coRes.rows) {
      const existing = await client.query('SELECT id FROM co_mastery WHERE user_id = $1 AND course_outcome_id = $2', [studentId, co.id]);
      
      if (existing.rows.length === 0) {
        // Create some pseudo-random mastery to make it look realistic
        const total = Math.floor(Math.random() * 20) + 10;
        const correct = Math.floor(Math.random() * total);
        const pct = Math.round((correct / total) * 100);
        let level = "weak";
        if (pct >= 90) level = "mastered";
        else if (pct >= 70) level = "proficient";
        else if (pct >= 40) level = "developing";

        await client.query(
          'INSERT INTO co_mastery (id, user_id, course_outcome_id, total_questions, correct_answers, mastery_pct, level) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [createId(), studentId, co.id, total, correct, pct, level]
        );
        console.log(`Inserted dummy mastery for ${co.code}: ${pct}% (${level})`);
      } else {
        console.log(`Dummy mastery already exists for ${co.code}`);
      }
    }

    console.log("Done inserting dummy mastery.");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await client.end();
  }
  process.exit(0);
}

main().catch(console.error);
