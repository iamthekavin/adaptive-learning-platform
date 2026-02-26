import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { course, courseOutcome } from "./course";
import { user } from "./auth";

// ─── Quiz ────────────────────────────────────────────────────
export const quiz = pgTable("quiz", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  maxAttempts: integer("max_attempts").notNull().default(1),
  status: text("status").notNull().default("draft"), // draft, published
  totalMarks: integer("total_marks").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Question (MCQ) ─────────────────────────────────────────
export const question = pgTable("question", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  text: text("text").notNull(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quiz.id, { onDelete: "cascade" }),
  courseOutcomeId: text("course_outcome_id")
    .references(() => courseOutcome.id, { onDelete: "set null" }),
  marks: integer("marks").notNull().default(1),
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Option (answer choice) ─────────────────────────────────
export const option = pgTable("option", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  text: text("text").notNull(),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id, { onDelete: "cascade" }),
  isCorrect: boolean("is_correct").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Quiz Session (student attempt) ─────────────────────────
export const quizSession = pgTable("quiz_session", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quiz.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
  score: integer("score"),
  totalMarks: integer("total_marks"),
  status: text("status").notNull().default("in_progress"), // in_progress, submitted
  riskScore: integer("risk_score").notNull().default(0), // 0–100
  flagged: boolean("flagged").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});


// ─── Student Answer ─────────────────────────────────────────
export const studentAnswer = pgTable("student_answer", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sessionId: text("session_id")
    .notNull()
    .references(() => quizSession.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => question.id, { onDelete: "cascade" }),
  selectedOptionId: text("selected_option_id")
    .references(() => option.id, { onDelete: "set null" }),
  isCorrect: boolean("is_correct"),
  timeTakenSeconds: integer("time_taken_seconds"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
