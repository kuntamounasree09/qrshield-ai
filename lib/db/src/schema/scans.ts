import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const scanContentTypes = [
  "url",
  "upi",
  "phone",
  "email",
  "plain_text",
  "unknown",
] as const;

export const scanRiskLevels = [
  "safe",
  "low",
  "medium",
  "high",
  "critical",
] as const;

export const scanAnalysisStatuses = [
  "completed",
  "decode_failed",
  "analysis_failed",
] as const;

export type ScanFindingRecord = {
  code: string;
  title: string;
  detail: string;
  scoreContribution: number;
  severity: (typeof scanRiskLevels)[number];
};

export type RedirectAnalysisRecord = {
  status:
    | "not_applicable"
    | "not_checked"
    | "completed"
    | "blocked"
    | "unavailable";
  finalUrl: string | null;
  hops: number;
  notes: string[];
};

export type ThreatIntelRecord = {
  status: "not_enabled" | "unavailable" | "no_match" | "match";
  provider: string | null;
  verdict: string | null;
  notes: string[];
};

export type AiAnalysisRecord = {
  status: "not_enabled" | "unavailable" | "completed";
  threatCategory: string | null;
  confidence: number | null;
  explanation: string | null;
  evidence: string[];
  limitations: string[];
};

export type RecommendationRecord = {
  title: string;
  detail: string;
  actions: string[];
};

export const scansTable = pgTable("scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
  sourceFilename: text("source_filename"),
  sourceMimeType: text("source_mime_type").notNull(),
  sourceSizeBytes: integer("source_size_bytes").notNull(),
  contentType: text("content_type", { enum: scanContentTypes }).notNull(),
  decodedContent: text("decoded_content").notNull(),
  normalizedUrl: text("normalized_url"),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level", { enum: scanRiskLevels }).notNull(),
  analysisStatus: text("analysis_status", {
    enum: scanAnalysisStatuses,
  }).notNull(),
  findings: jsonb("findings").$type<ScanFindingRecord[]>().notNull(),
  redirectAnalysis: jsonb("redirect_analysis")
    .$type<RedirectAnalysisRecord>()
    .notNull(),
  threatIntel: jsonb("threat_intel").$type<ThreatIntelRecord>().notNull(),
  aiAnalysis: jsonb("ai_analysis").$type<AiAnalysisRecord>().notNull(),
  recommendation: jsonb("recommendation")
    .$type<RecommendationRecord>()
    .notNull(),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({
  id: true,
  createdAt: true,
});

export type InsertScan = typeof scansTable.$inferInsert;
export type Scan = typeof scansTable.$inferSelect;