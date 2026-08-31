import type { ContentType } from "@workspace/api-zod";
import { BadRequestError } from "./http-errors";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const phonePattern = /^\+?[0-9][0-9\s().-]{6,24}$/;

export type ClassifiedContent = {
  contentType: ContentType;
  normalizedUrl: string | null;
};

export function classifyContent(decodedContent: string): ClassifiedContent {
  const content = decodedContent.trim();
  if (content.length === 0) {
    throw new BadRequestError("The QR code did not contain readable content.");
  }

  if (/^upi:\/\/pay(?:[/?]|$)/i.test(content)) {
    return { contentType: "upi", normalizedUrl: null };
  }

  if (/^https?:\/\//i.test(content)) {
    try {
      const url = new URL(content);
      if (!["http:", "https:"].includes(url.protocol)) {
        return { contentType: "unknown", normalizedUrl: null };
      }
      return { contentType: "url", normalizedUrl: url.href };
    } catch {
      return { contentType: "unknown", normalizedUrl: null };
    }
  }

  if (/^tel:/i.test(content) || phonePattern.test(content)) {
    return { contentType: "phone", normalizedUrl: null };
  }

  if (/^mailto:/i.test(content) || emailPattern.test(content)) {
    return { contentType: "email", normalizedUrl: null };
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(content)) {
    return { contentType: "unknown", normalizedUrl: null };
  }

  return { contentType: "plain_text", normalizedUrl: null };
}