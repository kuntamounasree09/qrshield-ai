import jsQR from "jsqr";
import sharp from "sharp";
import { BadRequestError } from "./http-errors";

export async function decodeQrImage(buffer: Buffer): Promise<string> {
  try {
    const { data, info } = await sharp(buffer, {
      limitInputPixels: 16_000_000,
      sequentialRead: true,
    })
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const result = jsQR(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      { inversionAttempts: "attemptBoth" },
    );

    const decoded = result?.data?.trim();
    if (!decoded) {
      throw new BadRequestError(
        "No readable QR code was found in that image. Try a sharper, better-lit image.",
      );
    }
    return decoded.slice(0, 4096);
  } catch (error) {
    if (error instanceof BadRequestError) throw error;
    throw new BadRequestError(
      "We could not decode that image. Try a PNG, JPEG, or WebP with one clear QR code.",
    );
  }
}