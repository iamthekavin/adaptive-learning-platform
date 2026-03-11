import {
  pgTable,
  text,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { department } from "./academic";
import { semester } from "./academic";
import { program } from "./academic";

// ─── Course (Subject / Paper) ────────────────────────────────
export const course = pgTable("course", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull(),
  credits: real("credits").notNull().default(3),
  type: text("type").notNull().default("theory"), // theory, lab, project, elective
  departmentId: text("department_id")
    .notNull()
    .references(() => department.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Semester-Course Map (junction: which courses in which semester for which program)
export const semesterCourseMap = pgTable("semester_course_map", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  semesterId: text("semester_id")
    .notNull()
    .references(() => semester.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),
  programId: text("program_id")
    .notNull()
    .references(() => program.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Course Outcome (CO) ────────────────────────────────────
export const courseOutcome = pgTable("course_outcome", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  code: text("code").notNull(), // CO1, CO2, etc.
  description: text("description").notNull(),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Course Unit ────────────────────────────────────────────
export const courseUnit = pgTable("course_unit", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  unitNumber: integer("unit_number").notNull(), // 1, 2, 3, 4, 5
  title: text("title").notNull(), // e.g. "Linear Structures"
  description: text("description"),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Unit Topic ─────────────────────────────────────────────
export const unitTopic = pgTable("unit_topic", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(), // e.g. "Arrays", "Linked Lists"
  unitId: text("unit_id")
    .notNull()
    .references(() => courseUnit.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
