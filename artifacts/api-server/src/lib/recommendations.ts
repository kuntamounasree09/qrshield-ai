import type { ContentType, RiskLevel } from "@workspace/api-zod";
import type { RecommendationRecord } from "@workspace/db";

export function getRecommendation(
  contentType: ContentType,
  riskLevel: RiskLevel,
): RecommendationRecord {
  if (riskLevel === "critical" || riskLevel === "high") {
    return {
      title: "Pause before interacting",
      detail:
        "High-risk indicators were detected. QRShield cannot prove intent, so do not open the destination, enter credentials, call the number, or send money until you verify it through a separate trusted channel.",
      actions: [
        "Do not open or share the destination",
        "Verify the sender or organization independently",
        "Use an official app or website instead of this QR code",
      ],
    };
  }

  if (contentType === "upi") {
    return {
      title: "Verify the recipient before paying",
      detail:
        "This appears to be a UPI payment payload. QRShield does not initiate payments or verify the recipient’s identity.",
      actions: [
        "Confirm the payee name and handle in your payment app",
        "Never approve a collect request you did not expect",
        "Use a known payment flow if anything looks different",
      ],
    };
  }

  if (contentType === "phone") {
    return {
      title: "Verify the number before calling",
      detail:
        "This QR contains phone contact information. Treat an unfamiliar number as untrusted until you can confirm who owns it.",
      actions: ["Check the number through a trusted source", "Do not share OTPs or account details"],
    };
  }

  if (contentType === "email") {
    return {
      title: "Check the recipient before responding",
      detail:
        "This QR contains an email address or mailto payload. Do not send sensitive information just because the address looks familiar.",
      actions: ["Verify the sender independently", "Avoid sharing passwords, codes, or identity documents"],
    };
  }

  if (contentType === "plain_text") {
    return {
      title: "Review the text carefully",
      detail:
        "The QR contains plain text. QRShield found no web destination to inspect, but text can still contain social-engineering instructions.",
      actions: ["Treat instructions as untrusted", "Do not run commands or download files based only on this text"],
    };
  }

  if (contentType === "unknown") {
    return {
      title: "Insufficient evidence",
      detail:
        "QRShield could not confidently classify this content. Avoid interacting with it until you understand what created it.",
      actions: ["Ask the QR owner what it should do", "Use a trusted alternative channel"],
    };
  }

  return {
    title: riskLevel === "safe" ? "Low risk based on detected signals" : "Review before continuing",
    detail:
      riskLevel === "safe"
        ? "No meaningful suspicious signals were detected in the content QRShield could inspect. This is not a guarantee of safety."
        : "Some caution signals were detected. Verify the destination and organization before entering information.",
    actions: [
      "Check the domain letter by letter",
      "Avoid entering sensitive information unless you expected this QR",
    ],
  };
}