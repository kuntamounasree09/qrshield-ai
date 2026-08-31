import { isPrivateHostname, isPrivateIp } from "./url-analyzer";
import dns from "node:dns/promises";

type RedirectResult = {
  status: "not_applicable" | "not_checked" | "completed" | "blocked" | "unavailable";
  finalUrl: string | null;
  hops: number;
  notes: string[];
};

const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 2500;

async function isSafeRemoteUrl(url: URL): Promise<boolean> {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (isPrivateHostname(url.hostname)) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)) {
    return !isPrivateIp(url.hostname);
  }
  try {
    const records = await dns.lookup(url.hostname, { all: true, verbatim: true });
    return records.length > 0 && records.every((record) => !isPrivateIp(record.address));
  } catch {
    return false;
  }
}

export async function inspectRedirects(
  rawUrl: string,
  enabled: boolean,
): Promise<RedirectResult> {
  if (!enabled) {
    return {
      status: "not_checked",
      finalUrl: null,
      hops: 0,
      notes: ["Redirect inspection is disabled in settings."],
    };
  }

  let current: URL;
  try {
    current = new URL(rawUrl);
  } catch {
    return {
      status: "not_applicable",
      finalUrl: null,
      hops: 0,
      notes: ["The decoded content is not an inspectable web address."],
    };
  }

  if (!(await isSafeRemoteUrl(current))) {
    return {
      status: "blocked",
      finalUrl: null,
      hops: 0,
      notes: ["The destination was not contacted because it did not pass network safety checks."],
    };
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    try {
      const response = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { "user-agent": "QRShield-Auditor/1.0" },
      });
      const location = response.headers.get("location");
      if (!location || ![301, 302, 303, 307, 308].includes(response.status)) {
        return {
          status: "completed",
          finalUrl: current.href,
          hops: hop,
          notes: [
            `The destination responded with HTTP ${response.status}. The page content was not opened or rendered.`,
          ],
        };
      }

      if (hop === MAX_REDIRECTS) {
        return {
          status: "completed",
          finalUrl: current.href,
          hops: hop,
          notes: [`Redirect limit reached after ${MAX_REDIRECTS} hops.`],
        };
      }

      const next = new URL(location, current);
      if (!(await isSafeRemoteUrl(next))) {
        return {
          status: "blocked",
          finalUrl: current.href,
          hops: hop + 1,
          notes: ["A redirect pointed to a private, local, or unsupported destination and was blocked."],
        };
      }
      current = next;
    } catch {
      return {
        status: "unavailable",
        finalUrl: current.href,
        hops: hop,
        notes: ["The destination could not be inspected within the safety timeout."],
      };
    }
  }

  return {
    status: "unavailable",
    finalUrl: current.href,
    hops: MAX_REDIRECTS,
    notes: ["Redirect inspection ended without a conclusive response."],
  };
}