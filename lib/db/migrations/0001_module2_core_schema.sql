CREATE TABLE "academic_year" (
	"id" text PRIMARY KEY NOT NULL,
	"year_number" integer NOT NULL,
	"regulation_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"institution_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"duration_years" integer DEFAULT 4 NOT NULL,
	"department_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regulation" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"effective_year" integer NOT NULL,
	"institution_id" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semester" (
	"id" text PRIMARY KEY NOT NULL,
	"semester_number" integer NOT NULL,
	"academic_year_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"credits" integer DEFAULT 3 NOT NULL,
	"type" text DEFAULT 'theory' NOT NULL,
	"department_id" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_outcome" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"course_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch" (
	"id" text PRIMARY KEY NOT NULL,
	"start_year" integer NOT NULL,
	"end_year" integer NOT NULL,
	"program_id" text NOT NULL,
	"regulation_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_enrollment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"batch_id" text NOT NULL,
	"roll_number" text NOT NULL,
	"current_semester" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teacher_allocation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"semester_course_map_id" text NOT NULL,
	"academic_year_label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institution" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" text DEFAULT 'engineering' NOT NULL,
	"university_id" text NOT NULL,
	"address" text,
	"website" text,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "institution_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "university" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text,
	"website" text,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "university_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "departments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "institutions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "regulations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "universities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "batches" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "programs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "semesters" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "departments" CASCADE;--> statement-breakpoint
DROP TABLE "institutions" CASCADE;--> statement-breakpoint
DROP TABLE "regulations" CASCADE;--> statement-breakpoint
DROP TABLE "universities" CASCADE;--> statement-breakpoint
DROP TABLE "courses" CASCADE;--> statement-breakpoint
DROP TABLE "batches" CASCADE;--> statement-breakpoint
DROP TABLE "programs" CASCADE;--> statement-breakpoint
DROP TABLE "semesters" CASCADE;--> statement-breakpoint
ALTER TABLE "semester_course_map" DROP CONSTRAINT "semester_course_map_semester_id_semesters_id_fk";
--> statement-breakpoint
ALTER TABLE "semester_course_map" DROP CONSTRAINT "semester_course_map_course_id_courses_id_fk";
--> statement-breakpoint
ALTER TABLE "semester_course_map" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "semester_course_map" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "semester_course_map" ALTER COLUMN "semester_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "semester_course_map" ALTER COLUMN "course_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "semester_course_map" ADD COLUMN "program_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_year" ADD CONSTRAINT "academic_year_regulation_id_regulation_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regulation" ADD CONSTRAINT "regulation_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester" ADD CONSTRAINT "semester_academic_year_id_academic_year_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_year"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_department_id_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_outcome" ADD CONSTRAINT "course_outcome_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch" ADD CONSTRAINT "batch_regulation_id_regulation_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."regulation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "student_enrollment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "student_enrollment_batch_id_batch_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_allocation" ADD CONSTRAINT "teacher_allocation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_allocation" ADD CONSTRAINT "teacher_allocation_semester_course_map_id_semester_course_map_id_fk" FOREIGN KEY ("semester_course_map_id") REFERENCES "public"."semester_course_map"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution" ADD CONSTRAINT "institution_university_id_university_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."university"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_course_map" ADD CONSTRAINT "semester_course_map_semester_id_semester_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semester"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_course_map" ADD CONSTRAINT "semester_course_map_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semester_course_map" ADD CONSTRAINT "semester_course_map_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE cascade ON UPDATE no action;