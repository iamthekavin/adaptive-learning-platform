import {
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { institution } from "./university";

// ─── Department ──────────────────────────────────────────────
export const department = pgTable("department", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull(),
  institutionId: text("institution_id")
    .notNull()
    .references(() => institution.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Program (e.g. B.Tech CSE, M.Tech AI) ───────────────────
export const program = pgTable("program", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull(),
  durationYears: integer("duration_years").notNull().default(4),
  departmentId: text("department_id")
    .notNull()
    .references(() => department.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Regulation (e.g. R20, R23) ─────────────────────────────
export const regulation = pgTable("regulation", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull(),
  effectiveYear: integer("effective_year").notNull(),
  institutionId: text("institution_id")
    .notNull()
    .references(() => institution.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Academic Year (Year 1, Year 2, etc. within a regulation)
export const academicYear = pgTable("academic_year", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  yearNumber: integer("year_number").notNull(), // 1, 2, 3, 4
  regulationId: text("regulation_id")
    .notNull()
    .references(() => regulation.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Semester (Sem 1, Sem 2 within an academic year) ─────────
export const semester = pgTable("semester", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  semesterNumber: integer("semester_number").notNull(), // 1, 2
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYear.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
