import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

const COOKIE_NAME = "qrshield_session";
const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 180;

export function getSessionId(req: Request, res: Response): string {
  const existing = req.signedCookies?.[COOKIE_NAME];
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }

  const sessionId = randomUUID();
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: COOKIE_MAX_AGE,
  });
  return sessionId;
}