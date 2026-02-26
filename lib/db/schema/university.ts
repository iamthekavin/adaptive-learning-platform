import {
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// ─── University ──────────────────────────────────────────────
export const university = pgTable("university", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  website: text("website"),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Institution (College) ───────────────────────────────────
export const institution = pgTable("institution", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull().default("engineering"), // engineering, arts, science, etc.
  universityId: text("university_id")
    .notNull()
    .references(() => university.id, { onDelete: "cascade" }),
  address: text("address"),
  website: text("website"),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
