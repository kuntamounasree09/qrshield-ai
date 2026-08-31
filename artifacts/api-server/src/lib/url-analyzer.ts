import dns from "node:dns/promises";
import net from "node:net";
import ipaddr from "ipaddr.js";
import type { ScanFindingRecord } from "@workspace/db";

export type UrlAnalysis = {
  findings: ScanFindingRecord[];
  blocked: boolean;
};

const suspiciousTlds = new Set(["zip", "mov", "click", "top", "xyz"]);
const shortenerHosts = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
]);
const protectedDomains = new Map([
  ["google.com", "Google"],
  ["microsoft.com", "Microsoft"],
  ["apple.com", "Apple"],
  ["paypal.com", "PayPal"],
  ["amazon.com", "Amazon"],
  ["sbi.co.in", "SBI"],
  ["hdfcbank.com", "HDFC Bank"],
  ["icicibank.com", "ICICI Bank"],
  ["axisbank.com", "Axis Bank"],
]);

function finding(
  code: string,
  title: string,
  detail: string,
  scoreContribution: number,
  severity: ScanFindingRecord["severity"],
): ScanFindingRecord {
  return { code, title, detail, scoreContribution, severity };
}

export function isPrivateIp(address: string): boolean {
  if (!net.isIP(address)) return false;
  const parsed = ipaddr.parse(address);
  const range = parsed.range();
  return [
    "unspecified",
    "loopback",
    "linkLocal",
    "private",
    "uniqueLocal",
    "carrierGradeNat",
    "reserved",
    "multicast",
  ].includes(range);
}

export function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  );
}

async function resolvePublicHost(hostname: string): Promise<{
  addresses: string[];
  blocked: boolean;
}> {
  if (isPrivateHostname(hostname)) return { addresses: [], blocked: true };
  if (net.isIP(hostname)) {
    return { addresses: [hostname], blocked: isPrivateIp(hostname) };
  }

  try {
    const records = await dns.lookup(hostname, { all: true, verbatim: true });
    const addresses = records.map((record) => record.address);
    return {
      addresses,
      blocked: addresses.length === 0 || addresses.some(isPrivateIp),
    };
  } catch {
    return { addresses: [], blocked: false };
  }
}

function levenshtein(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      row[j] =
        left[i - 1] === right[j - 1]
          ? previous
          : Math.min(previous + 1, row[j - 1] + 1, current + 1);
      previous = current;
    }
  }
  return row[right.length];
}

function analyzeHostname(hostname: string): ScanFindingRecord[] {
  const findings: ScanFindingRecord[] = [];
  const host = hostname.toLowerCase();
  const labels = host.split(".");
  const registrableHost = labels.slice(-2).join(".");

  if (host.startsWith("xn--") || host.includes("xn--")) {
    findings.push(
      finding(
        "PUNYCODE_HOST",
        "Punycode hostname",
        "The hostname uses an encoded form that can make lookalike characters harder to spot.",
        22,
        "medium",
      ),
    );
  }

  if (/[^\x00-\x7F]/.test(host)) {
    findings.push(
      finding(
        "UNICODE_HOST",
        "Non-ASCII hostname",
        "The hostname contains Unicode characters that may resemble trusted letters.",
        22,
        "medium",
      ),
    );
  }

  if (labels.length > 4) {
    findings.push(
      finding(
        "MANY_SUBDOMAINS",
        "Unusually deep hostname",
        "Multiple nested subdomains make the actual registrable domain harder to verify.",
        8,
        "low",
      ),
    );
  }

  const tld = labels.at(-1);
  if (tld && suspiciousTlds.has(tld)) {
    findings.push(
      finding(
        "UNCOMMON_TLD",
        "Uncommon top-level domain",
        `The link uses the .${tld} top-level domain. This is a caution signal, not proof of abuse.`,
        8,
        "low",
      ),
    );
  }

  if (shortenerHosts.has(registrableHost) || shortenerHosts.has(host)) {
    findings.push(
      finding(
        "URL_SHORTENER",
        "Shortened destination",
        "The visible hostname hides the final destination, so extra verification is needed.",
        12,
        "medium",
      ),
    );
  }

  const matchingBrand = [...protectedDomains.entries()].find(
    ([domain]) => host.includes(domain.split(".")[0]) && !host.endsWith(domain),
  );
  if (matchingBrand) {
    findings.push(
      finding(
        "BRAND_IMPERSONATION",
        `${matchingBrand[1]}-like hostname`,
        `The hostname contains the ${matchingBrand[1]} brand name but is not hosted on its protected domain.`,
        30,
        "high",
      ),
    );
  }

  for (const [domain, brand] of protectedDomains.entries()) {
    if (registrableHost === domain || host.endsWith(`.${domain}`)) continue;
    if (levenshtein(registrableHost, domain) <= 2) {
      findings.push(
        finding(
          "TYPOSQUATTING",
          `Possible ${brand} typosquat`,
          `The registrable domain is visually close to ${domain}, but it is not the protected domain.`,
          28,
          "high",
        ),
      );
      break;
    }
  }

  return findings;
}

export async function analyzeUrl(rawUrl: string): Promise<UrlAnalysis> {
  const findings: ScanFindingRecord[] = [];
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return {
      blocked: true,
      findings: [
        finding(
          "INVALID_URL",
          "Invalid web address",
          "The decoded content is not a valid web address.",
          80,
          "critical",
        ),
      ],
    };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    findings.push(
      finding(
        "UNSUPPORTED_SCHEME",
        "Unsupported link scheme",
        "Only standard HTTP and HTTPS destinations can be inspected.",
        80,
        "critical",
      ),
    );
    return { findings, blocked: true };
  }

  if (url.protocol === "http:") {
    findings.push(
      finding(
        "INSECURE_TRANSPORT",
        "Unencrypted connection",
        "The destination uses HTTP, so traffic can be observed or altered in transit.",
        16,
        "medium",
      ),
    );
  }

  if (url.username || url.password) {
    findings.push(
      finding(
        "EMBEDDED_CREDENTIALS",
        "Credentials embedded in link",
        "The URL contains a username or password field, which is unusual for a QR destination.",
        24,
        "high",
      ),
    );
  }

  const hostResult = await resolvePublicHost(url.hostname);
  if (hostResult.blocked) {
    findings.push(
      finding(
        "PRIVATE_DESTINATION",
        "Private or local destination blocked",
        "The destination resolves to a private, local, reserved, or otherwise non-public network address.",
        100,
        "critical",
      ),
    );
    return { findings, blocked: true };
  }

  if (net.isIP(url.hostname)) {
    findings.push(
      finding(
        "IP_HOST",
        "Direct IP destination",
        "The link points directly to an IP address instead of a recognizable domain.",
        18,
        "medium",
      ),
    );
  }

  findings.push(...analyzeHostname(url.hostname));

  const pathAndQuery = `${url.pathname}${url.search}`;
  if (pathAndQuery.length > 180 || (pathAndQuery.match(/%/g)?.length ?? 0) > 5) {
    findings.push(
      finding(
        "OBFUSCATED_PATH",
        "Unusually encoded destination",
        "The path or query contains a large amount of encoded content that is harder to review.",
        12,
        "medium",
      ),
    );
  }

  if (url.searchParams.size > 6) {
    findings.push(
      finding(
        "MANY_PARAMETERS",
        "Many query parameters",
        "The destination carries many parameters, so its final behavior is harder to verify from the QR alone.",
        6,
        "low",
      ),
    );
  }

  if (/(^|\/)(login|signin|verify|wallet|payment|reset)(\/|$)/i.test(url.pathname)) {
    findings.push(
      finding(
        "SENSITIVE_PATH",
        "Sensitive action path",
        "The path refers to sign-in, verification, payment, or account recovery activity.",
        12,
        "medium",
      ),
    );
  }

  return { findings, blocked: false };
}