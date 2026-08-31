import { BadRequestError } from "./http-errors";

export const MAX_UPLOAD_BYTES = Number(
  process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024,
);

const supportedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

function hasPrefix(buffer: Buffer, bytes: number[]): boolean {
  return bytes.every((byte, index) => buffer[index] === byte);
}

export function validateQrUpload(file: Express.Multer.File | undefined): void {
  if (!file) {
    throw new BadRequestError("Upload a QR image to begin analysis.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new BadRequestError(
      `The image is too large. Upload an image under ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
      413,
    );
  }

  const isPng = hasPrefix(file.buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isJpeg = hasPrefix(file.buffer, [0xff, 0xd8, 0xff]);
  const isWebp =
    hasPrefix(file.buffer, [0x52, 0x49, 0x46, 0x46]) &&
    file.buffer.subarray(8, 12).toString("ascii") === "WEBP";

  if (
    !supportedMimeTypes.has(file.mimetype) ||
    (!isPng && !isJpeg && !isWebp)
  ) {
    throw new BadRequestError(
      "That file does not look like a supported PNG, JPEG, or WebP image.",
    );
  }
}