CREATE TABLE "course_unit" (
	"id" text PRIMARY KEY NOT NULL,
	"unit_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"course_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_topic" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course" ALTER COLUMN "credits" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "course" ALTER COLUMN "credits" SET DEFAULT 3;--> statement-breakpoint
ALTER TABLE "co_mastery" ADD COLUMN "elo_rating" integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "elo_rating" integer DEFAULT 1200 NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz" ADD COLUMN "is_adaptive" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_unit" ADD CONSTRAINT "course_unit_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_topic" ADD CONSTRAINT "unit_topic_unit_id_course_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_unit"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_in_progress_session" ON "quiz_session" USING btree ("user_id","quiz_id") WHERE "quiz_session"."status" = 'in_progress';--> statement-breakpoint
ALTER TABLE "student_answer" ADD CONSTRAINT "unq_session_question" UNIQUE("session_id","question_id");