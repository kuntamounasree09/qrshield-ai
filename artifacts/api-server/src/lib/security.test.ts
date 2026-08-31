import { describe, expect, it } from "vitest";
import { classifyContent } from "./content-classifier";
import { getRecommendation } from "./recommendations";
import { calculateRisk, getRiskLevel } from "./risk-engine";
import { isPrivateHostname, isPrivateIp, analyzeUrl } from "./url-analyzer";

describe("QR content classification", () => {
  it.each([
    ["https://example.com", "url"],
    ["upi://pay?pa=merchant@example", "upi"],
    ["tel:+91 98765 43210", "phone"],
    ["hello@example.com", "email"],
    ["javascript:alert(1)", "unknown"],
    ["A one-time check-in code", "plain_text"],
  ])("classifies %s as %s", (content, contentType) => {
    expect(classifyContent(content).contentType).toBe(contentType);
  });
});

describe("deterministic risk engine", () => {
  it.each([
    [0, "safe"],
    [19, "safe"],
    [20, "low"],
    [39, "low"],
    [40, "medium"],
    [59, "medium"],
    [60, "high"],
    [79, "high"],
    [80, "critical"],
    [100, "critical"],
  ])("maps %s to %s", (score, level) => {
    expect(getRiskLevel(score)).toBe(level);
  });

  it("caps explainable contributions at 100", () => {
    expect(calculateRisk([
      { code: "a", title: "A", detail: "A", scoreContribution: 70, severity: "high" },
      { code: "b", title: "B", detail: "B", scoreContribution: 70, severity: "critical" },
    ])).toEqual({ riskScore: 100, riskLevel: "critical" });
  });
});

describe("URL safety analysis", () => {
  it("recognizes private and local targets", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.0.0.5")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateHostname("localhost")).toBe(true);
    expect(isPrivateHostname("printer.local")).toBe(true);
  });

  it("flags a protected-brand typosquat without contacting it", async () => {
    const analysis = await analyzeUrl("https://paypa1.com/login");
    expect(analysis.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(["TYPOSQUATTING", "SENSITIVE_PATH"]),
    );
    expect(analysis.blocked).toBe(false);
  });

  it("blocks loopback URLs as critical", async () => {
    const analysis = await analyzeUrl("http://127.0.0.1/admin");
    expect(analysis.blocked).toBe(true);
    expect(analysis.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PRIVATE_DESTINATION", scoreContribution: 100 }),
      ]),
    );
  });
});

describe("contextual recommendations", () => {
  it("does not tell users to pay automatically", () => {
    const recommendation = getRecommendation("upi", "safe");
    expect(recommendation.title).toContain("Verify");
    expect(recommendation.actions.join(" ")).toMatch(/payee|collect|trusted/i);
  });

  it("uses an urgent recommendation for high risk", () => {
    expect(getRecommendation("url", "critical").title).toBe("Pause before interacting");
  });
});