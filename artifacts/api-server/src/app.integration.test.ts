import { describe, expect, it } from "vitest";
import request from "supertest";
import QRCode from "qrcode";
import app from "./app";

describe("scan API", () => {
  it("analyzes and persists a UPI QR without optional providers", async () => {
    const agent = request.agent(app);
    const image = await QRCode.toBuffer("upi://pay?pa=merchant@example&am=25");
    const response = await agent
      .post("/api/scans")
      .attach("file", image, { filename: "payment.png", contentType: "image/png" });

    expect(response.status).toBe(201);
    expect(response.body.contentType).toBe("upi");
    expect(response.body.riskScore).toBe(0);
    expect(response.body.aiAnalysis.status).toBe("not_enabled");
    expect(response.body.threatIntel.status).toBe("not_enabled");
    expect(response.body.recommendation.title).toMatch(/verify/i);

    const history = await agent.get("/api/scans");
    expect(history.status).toBe(200);
    expect(history.body.items.some((item: { id: string }) => item.id === response.body.id)).toBe(true);

    const deleted = await agent.delete(`/api/scans/${response.body.id}`);
    expect(deleted.status).toBe(204);
  });

  it("rejects missing uploads without exposing internals", async () => {
    const response = await request(app).post("/api/scans");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Upload a QR image to begin analysis." });
  });
});