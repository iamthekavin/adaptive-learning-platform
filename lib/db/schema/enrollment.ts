import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";
import { program, regulation } from "./academic";
import { semesterCourseMap } from "./course";

// ─── Batch (Student cohort, e.g. 2023–2027) ─────────────────
export const batch = pgTable("batch", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  startYear: integer("start_year").notNull(),
  endYear: integer("end_year").notNull(),
  programId: text("program_id")
    .notNull()
    .references(() => program.id, { onDelete: "cascade" }),
  regulationId: text("regulation_id")
    .notNull()
    .references(() => regulation.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Student Enrollment (links a user to a batch) ───────────
export const studentEnrollment = pgTable("student_enrollment", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  batchId: text("batch_id")
    .notNull()
    .references(() => batch.id, { onDelete: "cascade" }),
  rollNumber: text("roll_number").notNull(),
  currentSemester: integer("current_semester").notNull().default(1),
  status: text("status").notNull().default("active"), // active, graduated, dropped
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Teacher Allocation (links a teacher to a semester-course)
export const teacherAllocation = pgTable("teacher_allocation", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  semesterCourseMapId: text("semester_course_map_id")
    .notNull()
    .references(() => semesterCourseMap.id, { onDelete: "cascade" }),
  academicYearLabel: text("academic_year_label").notNull(), // e.g. "2024-2025"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
