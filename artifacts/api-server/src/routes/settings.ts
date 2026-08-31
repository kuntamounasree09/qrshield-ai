import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";
import { db, settingsTable } from "@workspace/db";
import { getSessionId } from "../lib/session";

const router: IRouter = Router();

async function getOrCreateSettings(sessionId: string) {
  await db
    .insert(settingsTable)
    .values({ sessionId })
    .onConflictDoNothing({ target: settingsTable.sessionId });

  const [settings] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.sessionId, sessionId));
  return settings;
}

router.get("/settings", async (req, res): Promise<void> => {
  const sessionId = getSessionId(req, res);
  const settings = await getOrCreateSettings(sessionId);
  res.json(GetSettingsResponse.parse(settings));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.flatten() }, "Invalid settings update");
    res.status(400).json({ error: "Settings contain an invalid value." });
    return;
  }

  const sessionId = getSessionId(req, res);
  const current = await getOrCreateSettings(sessionId);
  const [updated] = await db
    .update(settingsTable)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(settingsTable.sessionId, current.sessionId))
    .returning();

  res.json(UpdateSettingsResponse.parse(updated));
});

export { getOrCreateSettings };
export default router;