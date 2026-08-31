import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true,
  }),
);
app.use(cookieParser(process.env.SESSION_SECRET ?? "qrshield-local-development-secret"));
const readRateLimit = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait before trying again." },
});
const scanRateLimit = rateLimit({
  windowMs: Number(process.env.SCAN_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  limit: Number(process.env.SCAN_RATE_LIMIT_MAX ?? 10),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Scan limit reached. Please wait before analyzing another image." },
});
app.use("/api", readRateLimit);
app.use("/api/scans", (req, res, next) =>
  req.method === "POST" ? scanRateLimit(req, res, next) : next(),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "The image is too large." });
      return;
    }
    res.status(400).json({ error: "The upload could not be processed." });
    return;
  }
  if (error instanceof Error && error.name === "HttpError") {
    const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 400;
    res.status(statusCode).json({ error: error.message });
    return;
  }
  logger.error({ err: error }, "Unhandled API error");
  res.status(500).json({ error: "The server could not complete that request." });
});

export default app;
