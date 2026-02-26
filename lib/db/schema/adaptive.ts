import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { courseOutcome } from "./course";
import { user } from "./auth";

// ─── CO Mastery (per-student, per-CO performance snapshot) ──
export const coMastery = pgTable("co_mastery", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  courseOutcomeId: text("course_outcome_id")
    .notNull()
    .references(() => courseOutcome.id, { onDelete: "cascade" }),
  totalQuestions: integer("total_questions").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  masteryPct: real("mastery_pct").notNull().default(0), // 0–100
  level: text("level").notNull().default("weak"), // weak, developing, proficient, mastered
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
