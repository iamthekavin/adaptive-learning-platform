import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/admin/access";

/**
 * Access control statements for the Adaptive Learning Platform.
 * Extends better-auth's default statements with custom resource permissions.
 */
export const statement = {
  ...defaultStatements,
  // Academic management resources
  institution: ["create", "read", "update", "delete"],
  department: ["create", "read", "update", "delete"],
  program: ["create", "read", "update", "delete"],
  regulation: ["create", "read", "update", "delete"],
  course: ["create", "read", "update", "delete"],
  assessment: ["create", "read", "update", "delete", "grade"],
  // Content resources
  lessonPlan: ["create", "read", "update", "delete"],
  material: ["create", "read", "update", "delete"],
  // Student resources
  enrollment: ["create", "read", "update", "delete"],
  progress: ["read"],
  report: ["read", "generate"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Admin role — full access to everything
 */
export const adminRole = ac.newRole({
  ...adminAc.statements,
  institution: ["create", "read", "update", "delete"],
  department: ["create", "read", "update", "delete"],
  program: ["create", "read", "update", "delete"],
  regulation: ["create", "read", "update", "delete"],
  course: ["create", "read", "update", "delete"],
  assessment: ["create", "read", "update", "delete", "grade"],
  lessonPlan: ["create", "read", "update", "delete"],
  material: ["create", "read", "update", "delete"],
  enrollment: ["create", "read", "update", "delete"],
  progress: ["read"],
  report: ["read", "generate"],
});

/**
 * Teacher role — manage courses, content, assessments, view student progress
 */
export const teacherRole = ac.newRole({
  course: ["read"],
  assessment: ["create", "read", "update", "grade"],
  lessonPlan: ["create", "read", "update", "delete"],
  material: ["create", "read", "update", "delete"],
  enrollment: ["read"],
  progress: ["read"],
  report: ["read"],
});

/**
 * Student role — view content, take assessments, track own progress
 */
export const studentRole = ac.newRole({
  course: ["read"],
  assessment: ["read"],
  lessonPlan: ["read"],
  material: ["read"],
  enrollment: ["read"],
  progress: ["read"],
  report: ["read"],
});
