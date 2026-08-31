import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { decodeQrImage } from "./qr-decoder";

describe("QR image decoding", () => {
  it("decodes a real PNG QR image server-side", async () => {
    const image = await QRCode.toBuffer("upi://pay?pa=merchant@example&am=25");
    await expect(decodeQrImage(image)).resolves.toBe(
      "upi://pay?pa=merchant@example&am=25",
    );
  });

  it("rejects a non-QR image with a safe client error", async () => {
    await expect(decodeQrImage(Buffer.from("not-an-image"))).rejects.toThrow(
      /could not decode/i,
    );
  });
});