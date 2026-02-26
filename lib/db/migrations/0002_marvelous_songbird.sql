CREATE TABLE "co_mastery" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_outcome_id" text NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"mastery_pct" real DEFAULT 0 NOT NULL,
	"level" text DEFAULT 'weak' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "option" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"question_id" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"quiz_id" text NOT NULL,
	"course_outcome_id" text,
	"marks" integer DEFAULT 1 NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"course_id" text NOT NULL,
	"created_by" text NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"max_attempts" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_marks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_session" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"submitted_at" timestamp,
	"score" integer,
	"total_marks" integer,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_answer" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"question_id" text NOT NULL,
	"selected_option_id" text,
	"is_correct" boolean,
	"time_taken_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proctor_event" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"event_type" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "co_mastery" ADD CONSTRAINT "co_mastery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "co_mastery" ADD CONSTRAINT "co_mastery_course_outcome_id_course_outcome_id_fk" FOREIGN KEY ("course_outcome_id") REFERENCES "public"."course_outcome"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option" ADD CONSTRAINT "option_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question" ADD CONSTRAINT "question_course_outcome_id_course_outcome_id_fk" FOREIGN KEY ("course_outcome_id") REFERENCES "public"."course_outcome"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_quiz_id_quiz_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session" ADD CONSTRAINT "quiz_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_answer" ADD CONSTRAINT "student_answer_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_answer" ADD CONSTRAINT "student_answer_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_answer" ADD CONSTRAINT "student_answer_selected_option_id_option_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."option"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proctor_event" ADD CONSTRAINT "proctor_event_session_id_quiz_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_session"("id") ON DELETE cascade ON UPDATE no action;