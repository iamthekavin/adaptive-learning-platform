import { z } from "zod";

// ─── University ──────────────────────────────────────────────
export const createUniversitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "Code must be at least 2 characters").max(20),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().optional(),
});
export const updateUniversitySchema = createUniversitySchema.partial();

// ─── Institution ─────────────────────────────────────────────
export const createInstitutionSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  type: z.enum(["engineering", "arts", "science", "management", "pharmacy", "other"]).default("engineering"),
  universityId: z.string().min(1, "University is required"),
  address: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().optional(),
});
export const updateInstitutionSchema = createInstitutionSchema.partial();

// ─── Department ──────────────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  institutionId: z.string().min(1, "Institution is required"),
});
export const updateDepartmentSchema = createDepartmentSchema.partial();

// ─── Program ─────────────────────────────────────────────────
export const createProgramSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  durationYears: z.number().int().min(1).max(6).default(4),
  departmentId: z.string().min(1, "Department is required"),
});
export const updateProgramSchema = createProgramSchema.partial();

// ─── Regulation ──────────────────────────────────────────────
export const createRegulationSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(20),
  effectiveYear: z.number().int().min(2000).max(2100),
  institutionId: z.string().min(1, "Institution is required"),
  description: z.string().optional(),
});
export const updateRegulationSchema = createRegulationSchema.partial();

// ─── Batch ───────────────────────────────────────────────────
export const createBatchSchema = z.object({
  startYear: z.number().int().min(2000).max(2100),
  endYear: z.number().int().min(2000).max(2100),
  programId: z.string().min(1, "Program is required"),
  regulationId: z.string().min(1, "Regulation is required"),
}).refine((data) => data.endYear > data.startYear, {
  message: "End year must be after start year",
  path: ["endYear"],
});
export const updateBatchSchema = z.object({
  startYear: z.number().int().min(2000).max(2100).optional(),
  endYear: z.number().int().min(2000).max(2100).optional(),
  programId: z.string().min(1).optional(),
  regulationId: z.string().min(1).optional(),
});

// ─── Course ──────────────────────────────────────────────────
export const createCourseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2).max(20),
  credits: z.number().int().min(1).max(10).default(3),
  type: z.enum(["theory", "lab", "project", "elective"]).default("theory"),
  departmentId: z.string().min(1, "Department is required"),
  description: z.string().optional(),
});
export const updateCourseSchema = createCourseSchema.partial();

// ─── Academic Year ───────────────────────────────────────────
export const createAcademicYearSchema = z.object({
  yearNumber: z.number().int().min(1).max(6),
  regulationId: z.string().min(1, "Regulation is required"),
});

// ─── Semester ────────────────────────────────────────────────
export const createSemesterSchema = z.object({
  semesterNumber: z.number().int().min(1).max(12),
  academicYearId: z.string().min(1, "Academic year is required"),
});

// ─── Semester-Course Map ─────────────────────────────────────
export const createSemesterCourseMapSchema = z.object({
  semesterId: z.string().min(1, "Semester is required"),
  courseId: z.string().min(1, "Course is required"),
  programId: z.string().min(1, "Program is required"),
});
export const updateSemesterCourseMapSchema = createSemesterCourseMapSchema.partial();

// ─── Teacher Allocation ──────────────────────────────────────
export const createTeacherAllocationSchema = z.object({
  userId: z.string().min(1, "Teacher is required"),
  semesterCourseMapId: z.string().min(1, "Semester-Course mapping is required"),
  academicYearLabel: z.string().min(4, "Academic year label is required (e.g. 2024-2025)"),
});
export const updateTeacherAllocationSchema = createTeacherAllocationSchema.partial();

// ─── Student Enrollment ──────────────────────────────────────
export const createStudentEnrollmentSchema = z.object({
  userId: z.string().min(1, "Student is required"),
  batchId: z.string().min(1, "Batch is required"),
  rollNumber: z.string().min(1, "Roll number is required"),
  currentSemester: z.number().int().min(1).max(12).default(1),
  status: z.enum(["active", "graduated", "dropped"]).default("active"),
});
export const updateStudentEnrollmentSchema = createStudentEnrollmentSchema.partial();

// ─── Quiz ────────────────────────────────────────────────────
const baseQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  courseId: z.string().min(1, "Course is required"),
  durationMinutes: z.number().int().min(1).max(300),
  maxAttempts: z.number().int().min(1).max(10),
});

export const createQuizSchema = baseQuizSchema.extend({
  durationMinutes: z.number().int().min(1).max(300).default(30),
  maxAttempts: z.number().int().min(1).max(10).default(1),
});

export const updateQuizSchema = baseQuizSchema.partial().extend({
  status: z.enum(["draft", "published"]).optional(),
});

// ─── Question ────────────────────────────────────────────────
export const createQuestionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  courseOutcomeId: z.string().optional(),
  marks: z.number().int().min(1).default(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  options: z.array(z.object({
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
  })).min(2, "At least 2 options required"),
});
export const updateQuestionSchema = z.object({
  text: z.string().min(1).optional(),
  courseOutcomeId: z.string().nullable().optional(),
  marks: z.number().int().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  options: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
  })).min(2, "At least 2 options required").optional(),
});
