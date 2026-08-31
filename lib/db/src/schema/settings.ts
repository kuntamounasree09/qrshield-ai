import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const settingsTable = pgTable("settings", {
  sessionId: text("session_id").primaryKey(),
  language: text("language", { enum: ["en", "te", "hi"] })
    .notNull()
    .default("en"),
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  redirectAnalysisEnabled: boolean("redirect_analysis_enabled")
    .notNull()
    .default(true),
  threatIntelEnabled: boolean("threat_intel_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({
  updatedAt: true,
});

export type InsertSettings = typeof settingsTable.$inferInsert;
export type Settings = typeof settingsTable.$inferSelect;