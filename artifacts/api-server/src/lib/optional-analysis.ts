import type {
  AiAnalysisRecord,
  ScanFindingRecord,
  ThreatIntelRecord,
} from "@workspace/db";

const OPTIONAL_REQUEST_TIMEOUT_MS = 3000;

function providerHeaders(apiKey: string | undefined): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
  };
}

function asText(value: unknown, maxLength = 4000): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, maxLength)
    : null;
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export async function getThreatIntelResult(
  url: string | null,
  enabled: boolean,
): Promise<ThreatIntelRecord> {
  const endpoint = process.env.THREAT_INTEL_API_URL;
  if (!enabled || !endpoint) {
    return {
      status: "not_enabled",
      provider: null,
      verdict: null,
      notes: ["No threat-intelligence provider is configured."],
    };
  }

  if (!url) {
    return {
      status: "unavailable",
      provider: process.env.THREAT_INTEL_PROVIDER ?? "configured provider",
      verdict: null,
      notes: ["No web destination was available for the configured lookup."],
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: providerHeaders(process.env.THREAT_INTEL_API_KEY),
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(OPTIONAL_REQUEST_TIMEOUT_MS),
    });
    const body = await readJson(response);
    if (!response.ok || !body) throw new Error(`provider status ${response.status}`);

    const verdict = asText(body.verdict ?? body.label, 200);
    const malicious =
      typeof body.malicious === "boolean"
        ? body.malicious
        : typeof body.match === "boolean"
          ? body.match
          : null;
    if (malicious === null && !verdict) throw new Error("provider returned no verdict");

    return {
      status: malicious || /malicious|phishing|fraud|malware/i.test(verdict ?? "")
        ? "match"
        : "no_match",
      provider: process.env.THREAT_INTEL_PROVIDER ?? "configured provider",
      verdict: verdict ?? (malicious ? "match" : "no match"),
      notes: ["Returned by the configured threat-intelligence provider. This signal does not change the deterministic score."],
    };
  } catch {
    return {
      status: "unavailable",
      provider: process.env.THREAT_INTEL_PROVIDER ?? "configured provider",
      verdict: null,
      notes: ["The configured threat-intelligence provider did not respond within the safety timeout."],
    };
  }
}

export async function getAiAnalysis(
  decodedContent: string,
  findings: ScanFindingRecord[],
  enabled: boolean,
): Promise<AiAnalysisRecord> {
  const endpoint = process.env.AI_API_URL;
  if (!enabled || !endpoint) {
    return {
      status: "not_enabled",
      threatCategory: null,
      confidence: null,
      explanation: null,
      evidence: [],
      limitations: ["AI explanation is not configured."],
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: providerHeaders(process.env.AI_API_KEY),
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "qrshield-analysis",
        messages: [
          {
            role: "system",
            content:
              "Explain QR safety using only the decoded content and supplied deterministic findings. Do not invent findings, URLs, or actions. Return JSON with explanation, threatCategory, and confidence.",
          },
          {
            role: "user",
            content: JSON.stringify({
              decodedContent: decodedContent.slice(0, 4096),
              deterministicFindings: findings.map(({ code, title, detail, scoreContribution }) => ({
                code,
                title,
                detail,
                scoreContribution,
              })),
            }),
          },
        ],
      }),
      signal: AbortSignal.timeout(OPTIONAL_REQUEST_TIMEOUT_MS),
    });
    const body = await readJson(response);
    if (!response.ok || !body) throw new Error(`provider status ${response.status}`);

    const choiceContent =
      body.choices &&
      Array.isArray(body.choices) &&
      body.choices[0] &&
      typeof body.choices[0] === "object" &&
      "message" in body.choices[0] &&
      body.choices[0].message &&
      typeof body.choices[0].message === "object" &&
      "content" in body.choices[0].message
        ? (body.choices[0].message as { content?: unknown }).content
        : null;
    const explanation = asText(body.explanation ?? choiceContent);
    if (!explanation) throw new Error("provider returned no explanation");

    const confidence =
      typeof body.confidence === "number" && body.confidence >= 0 && body.confidence <= 1
        ? body.confidence
        : null;
    return {
      status: "completed",
      threatCategory: asText(body.threatCategory ?? body.category, 120),
      confidence,
      explanation,
      evidence: findings.slice(0, 5).map((finding) => finding.title),
      limitations: [
        "AI interpretation is supplementary. The deterministic score and signal ledger remain authoritative.",
      ],
    };
  } catch {
    return {
      status: "unavailable",
      threatCategory: null,
      confidence: null,
      explanation: null,
      evidence: [],
      limitations: [
        "The optional AI service did not provide a response. The deterministic analysis remains authoritative.",
      ],
    };
  }
}