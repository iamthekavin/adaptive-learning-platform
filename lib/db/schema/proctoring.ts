import {
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { quizSession } from "./assessment";

// ─── Proctor Event (tab-switch, blur, focus, copy) ──────────
export const proctorEvent = pgTable("proctor_event", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  sessionId: text("session_id")
    .notNull()
    .references(() => quizSession.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // tab_switch, blur, focus, copy_attempt
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: text("metadata"), // optional JSON string for extra context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
