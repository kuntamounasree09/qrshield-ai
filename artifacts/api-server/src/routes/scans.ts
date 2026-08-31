import path from "node:path";
import { Router, type IRouter } from "express";
import multer from "multer";
import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import {
  CreateScanResponse,
  DeleteScanParams,
  GetScanParams,
  GetScanResponse,
  GetScanSummaryResponse,
  ListScansQueryParams,
  ListScansResponse,
} from "@workspace/api-zod";
import {
  db,
  scansTable,
  type RedirectAnalysisRecord,
  type ScanFindingRecord,
} from "@workspace/db";
import { classifyContent } from "../lib/content-classifier";
import { validateQrUpload, MAX_UPLOAD_BYTES } from "../lib/file-validation";
import { decodeQrImage } from "../lib/qr-decoder";
import { inspectRedirects } from "../lib/redirect-analyzer";
import { calculateRisk } from "../lib/risk-engine";
import { analyzeUrl } from "../lib/url-analyzer";
import { getRecommendation } from "../lib/recommendations";
import { getAiAnalysis, getThreatIntelResult } from "../lib/optional-analysis";
import { getSessionId } from "../lib/session";
import { getOrCreateSettings } from "./settings";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 2 },
});

function safeFilename(filename: string | undefined): string | null {
  if (!filename) return null;
  return path
    .basename(filename)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .slice(0, 255);
}

function getRedirectFinding(
  redirect: RedirectAnalysisRecord,
): ScanFindingRecord | null {
  if (redirect.status === "blocked") {
    return {
      code: "REDIRECT_BLOCKED",
      title: "Unsafe redirect blocked",
      detail:
        "A redirect pointed to a private, local, or unsupported destination and was not followed.",
      scoreContribution: 35,
      severity: "high",
    };
  }
  if (redirect.status === "unavailable") {
    return {
      code: "REDIRECT_UNAVAILABLE",
      title: "Redirect could not be confirmed",
      detail:
        "The destination did not respond within the safety timeout. This is uncertainty, not proof of malicious behavior.",
      scoreContribution: 8,
      severity: "low",
    };
  }
  return null;
}

function toScanResult(scan: typeof scansTable.$inferSelect) {
  return CreateScanResponse.parse({
    id: scan.id,
    createdAt: scan.createdAt,
    filename: scan.sourceFilename,
    contentType: scan.contentType,
    decodedContent: scan.decodedContent,
    normalizedUrl: scan.normalizedUrl,
    riskScore: scan.riskScore,
    riskLevel: scan.riskLevel,
    analysisStatus: scan.analysisStatus,
    findings: scan.findings,
    redirectAnalysis: scan.redirectAnalysis,
    threatIntel: scan.threatIntel,
    aiAnalysis: scan.aiAnalysis,
    recommendation: scan.recommendation,
  });
}

router.get("/scans", async (req, res): Promise<void> => {
  const query = ListScansQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Scan history filters are invalid." });
    return;
  }

  const { page, pageSize, riskLevel, contentType, search } = query.data;
  const sessionId = getSessionId(req, res);
  const filters = [eq(scansTable.sessionId, sessionId)];
  if (riskLevel) filters.push(eq(scansTable.riskLevel, riskLevel));
  if (contentType) filters.push(eq(scansTable.contentType, contentType));
  if (search) filters.push(ilike(scansTable.decodedContent, `%${search}%`));

  const where = and(...filters);
  const [totalRow] = await db
    .select({ count: count() })
    .from(scansTable)
    .where(where);
  const rows = await db
    .select()
    .from(scansTable)
    .where(where)
    .orderBy(desc(scansTable.createdAt), asc(scansTable.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const response = {
    items: rows.map((scan) => ({
      id: scan.id,
      createdAt: scan.createdAt,
      contentType: scan.contentType,
      preview: scan.decodedContent.slice(0, 140),
      riskScore: scan.riskScore,
      riskLevel: scan.riskLevel,
    })),
    page,
    pageSize,
    total: Number(totalRow?.count ?? 0),
  };
  res.json(ListScansResponse.parse(response));
});

router.get("/scans/summary", async (req, res): Promise<void> => {
  const sessionId = getSessionId(req, res);
  const rows = await db
    .select({
      riskLevel: scansTable.riskLevel,
      createdAt: scansTable.createdAt,
    })
    .from(scansTable)
    .where(eq(scansTable.sessionId, sessionId))
    .orderBy(desc(scansTable.createdAt));

  const highRiskScans = rows.filter((row) =>
    ["high", "critical"].includes(row.riskLevel),
  ).length;
  const safeScans = rows.filter((row) => row.riskLevel === "safe").length;
  res.json(
    GetScanSummaryResponse.parse({
      totalScans: rows.length,
      highRiskScans,
      safeScans,
      lastScanAt: rows[0]?.createdAt?.toISOString() ?? null,
    }),
  );
});

router.post(
  "/scans",
  upload.single("file"),
  async (req, res): Promise<void> => {
    const sessionId = getSessionId(req, res);
    validateQrUpload(req.file);
    const settings = await getOrCreateSettings(sessionId);
    const decodedContent = await decodeQrImage(req.file!.buffer);
    const classified = classifyContent(decodedContent);

    let findings: ScanFindingRecord[] = [];
    let redirectAnalysis: RedirectAnalysisRecord = {
      status: "not_applicable",
      finalUrl: null,
      hops: 0,
      notes: ["Redirect inspection applies only to web destinations."],
    };

    if (classified.contentType === "url" && classified.normalizedUrl) {
      const urlAnalysis = await analyzeUrl(classified.normalizedUrl);
      findings = [...urlAnalysis.findings];
      redirectAnalysis = await inspectRedirects(
        classified.normalizedUrl,
        settings.redirectAnalysisEnabled && !urlAnalysis.blocked,
      );
      const redirectFinding = getRedirectFinding(redirectAnalysis);
      if (redirectFinding) findings.push(redirectFinding);
    }

    const { riskScore, riskLevel } = calculateRisk(findings);
    const threatIntel = await getThreatIntelResult(
      classified.normalizedUrl,
      settings.threatIntelEnabled,
    );
    const aiAnalysis = await getAiAnalysis(
      decodedContent,
      findings,
      settings.aiEnabled,
    );
    const recommendation = getRecommendation(
      classified.contentType,
      riskLevel,
    );

    const [scan] = await db
      .insert(scansTable)
      .values({
        sessionId,
        sourceFilename: safeFilename(req.file?.originalname),
        sourceMimeType: req.file!.mimetype,
        sourceSizeBytes: req.file!.size,
        contentType: classified.contentType,
        decodedContent,
        normalizedUrl: classified.normalizedUrl,
        riskScore,
        riskLevel,
        analysisStatus: "completed",
        findings,
        redirectAnalysis,
        threatIntel,
        aiAnalysis,
        recommendation,
      })
      .returning();

    req.log.info(
      { scanId: scan.id, contentType: classified.contentType, riskScore },
      "QR scan analyzed",
    );
    res.status(201).json(toScanResult(scan));
  },
);

router.get("/scans/:id", async (req, res): Promise<void> => {
  const params = GetScanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Scan id is invalid." });
    return;
  }

  const sessionId = getSessionId(req, res);
  const [scan] = await db
    .select()
    .from(scansTable)
    .where(
      and(eq(scansTable.id, params.data.id), eq(scansTable.sessionId, sessionId)),
    );
  if (!scan) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }

  res.json(GetScanResponse.parse(toScanResult(scan)));
});

router.delete("/scans/:id", async (req, res): Promise<void> => {
  const params = DeleteScanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Scan id is invalid." });
    return;
  }

  const sessionId = getSessionId(req, res);
  const deleted = await db
    .delete(scansTable)
    .where(
      and(eq(scansTable.id, params.data.id), eq(scansTable.sessionId, sessionId)),
    )
    .returning({ id: scansTable.id });
  if (!deleted[0]) {
    res.status(404).json({ error: "Scan not found." });
    return;
  }
  res.sendStatus(204);
});

export default router;