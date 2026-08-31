import type { ScanFindingRecord } from "@workspace/db";
import type { RiskLevel } from "@workspace/api-zod";

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "safe";
}

export function calculateRisk(findings: ScanFindingRecord[]): {
  riskScore: number;
  riskLevel: RiskLevel;
} {
  const riskScore = Math.min(
    100,
    findings.reduce((total, item) => total + item.scoreContribution, 0),
  );
  return { riskScore, riskLevel: getRiskLevel(riskScore) };
}