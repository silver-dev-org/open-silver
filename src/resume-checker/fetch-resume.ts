// SSRF-hardened fetch for the caller-supplied resume URL on /api/grade.
//
// The URL comes straight from whatever a visitor pastes into the resume
// checker, so it cannot be reduced to a host allowlist. Instead every hop is
// resolved ourselves, every resolved address is checked against the private /
// reserved ranges, and the connection is then pinned to the address we
// validated -- so a DNS rebind cannot swap in 169.254.169.254 between the
// check and the connect. On top of that the whole download is bounded by a
// wall-clock deadline and a byte cap, which the 300s route budget otherwise
// left wide open.

import dns from "node:dns/promises";
import https from "node:https";
import net from "node:net";

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 3;

/** Carries a stable code the API route can hand back as a 4xx. */
export class ResumeFetchError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
    this.name = "ResumeFetchError";
  }
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

function ipv6ToBytes(input: string): Uint8Array | null {
  const ip = input.split("%")[0];
  const halves = ip.split("::");
  if (halves.length > 2) return null;

  const toWords = (part: string): number[] | null => {
    if (!part) return [];
    const words: number[] = [];
    const tokens = part.split(":");
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.includes(".")) {
        // Trailing dotted-quad, as in ::ffff:127.0.0.1.
        if (i !== tokens.length - 1) return null;
        const v4 = ipv4ToInt(token);
        if (v4 === null) return null;
        words.push((v4 >>> 16) & 0xffff, v4 & 0xffff);
        continue;
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(token)) return null;
      words.push(parseInt(token, 16));
    }
    return words;
  };

  const head = toWords(halves[0]);
  const tail = halves.length === 2 ? toWords(halves[1]) : [];
  if (!head || !tail) return null;

  let words: number[];
  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null;
    words = [...head, ...new Array<number>(fill).fill(0), ...tail];
  } else {
    words = head;
  }
  if (words.length !== 8) return null;

  const bytes = new Uint8Array(16);
  words.forEach((word, i) => {
    bytes[i * 2] = (word >>> 8) & 0xff;
    bytes[i * 2 + 1] = word & 0xff;
  });
  return bytes;
}

// Everything that is not globally routable unicast: loopback, link-local
// (incl. the cloud metadata endpoint), RFC1918, CGNAT, benchmarking,
// documentation, multicast and reserved space.
const BLOCKED_V4: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const BLOCKED_V6: ReadonlyArray<readonly [string, number]> = [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["100::", 64], // discard-only
  ["2001:db8::", 32], // documentation
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link local
  ["ff00::", 8], // multicast
];

function inV4Cidr(value: number, base: string, prefix: number): boolean {
  const baseValue = ipv4ToInt(base);
  if (baseValue === null) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return ((value ^ baseValue) & mask) === 0;
}

function inV6Cidr(bytes: Uint8Array, base: string, prefix: number): boolean {
  const baseBytes = ipv6ToBytes(base);
  if (!baseBytes) return false;

  const fullBytes = prefix >> 3;
  for (let i = 0; i < fullBytes; i++) {
    if (bytes[i] !== baseBytes[i]) return false;
  }
  const remainingBits = prefix & 7;
  if (remainingBits === 0) return true;

  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (bytes[fullBytes] & mask) === (baseBytes[fullBytes] & mask);
}

function isPublicV4(value: number): boolean {
  return !BLOCKED_V4.some(([base, prefix]) => inV4Cidr(value, base, prefix));
}

/** True only for addresses that are globally routable unicast. */
export function isPublicAddress(address: string): boolean {
  const family = net.isIP(address);

  if (family === 4) {
    const value = ipv4ToInt(address);
    return value !== null && isPublicV4(value);
  }

  if (family !== 6) return false;

  const bytes = ipv6ToBytes(address);
  if (!bytes) return false;

  if (BLOCKED_V6.some(([base, prefix]) => inV6Cidr(bytes, base, prefix))) {
    return false;
  }

  // Transition formats smuggle an IPv4 address inside an IPv6 one, so the
  // embedded address has to clear the IPv4 rules too.
  const embeddedV4 = (offset: number) =>
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0;

  if (inV6Cidr(bytes, "::ffff:0:0", 96)) return isPublicV4(embeddedV4(12));
  if (inV6Cidr(bytes, "64:ff9b::", 96)) return isPublicV4(embeddedV4(12));
  if (inV6Cidr(bytes, "2002::", 16)) return isPublicV4(embeddedV4(2));

  return true;
}

function bareHostname(url: URL): string {
  // URL keeps IPv6 literals bracketed; net/dns want them bare.
  return url.hostname.startsWith("[")
    ? url.hostname.slice(1, -1)
    : url.hostname;
}

function parseResumeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ResumeFetchError("InvalidResumeURL", 400);
  }

  if (url.protocol !== "https:") {
    throw new ResumeFetchError("InvalidResumeURL", 400);
  }
  // Credentials in the URL are only ever useful for confusing a parser here.
  if (url.username || url.password) {
    throw new ResumeFetchError("InvalidResumeURL", 400);
  }
  // Non-443 ports turn this endpoint into an internal port scanner.
  if (url.port && url.port !== "443") {
    throw new ResumeFetchError("BlockedResumeURL", 400);
  }

  return url;
}

async function resolvePinnedAddress(url: URL): Promise<string> {
  const hostname = bareHostname(url);

  if (net.isIP(hostname)) {
    if (!isPublicAddress(hostname)) {
      throw new ResumeFetchError("BlockedResumeURL", 400);
    }
    return hostname;
  }

  let records: Array<{ address: string }>;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    throw new ResumeFetchError("ResumeURLUnreachable", 400);
  }

  // One bad record poisons the host: a round-robin that mixes a public and a
  // private answer is exactly what an attacker would set up.
  if (
    records.length === 0 ||
    !records.every((record) => isPublicAddress(record.address))
  ) {
    throw new ResumeFetchError("BlockedResumeURL", 400);
  }

  return records[0].address;
}

type HopResult =
  { kind: "body"; body: Buffer } | { kind: "redirect"; location: string };

function requestHop(
  url: URL,
  address: string,
  deadline: number,
): Promise<HopResult> {
  return new Promise<HopResult>((resolve, reject) => {
    const budget = deadline - Date.now();
    if (budget <= 0) {
      reject(new ResumeFetchError("ResumeFetchTimeout", 504));
      return;
    }

    const hostname = bareHostname(url);
    let settled = false;

    const finish = (result: HopResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };

    const request = https.request(
      {
        host: address,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        // Connect to the address we validated, but keep TLS and routing
        // pointed at the name the caller asked for.
        servername: net.isIP(hostname) ? undefined : hostname,
        headers: {
          host: url.host,
          accept: "application/pdf,*/*",
          "user-agent": "silver-resume-checker",
        },
        timeout: budget,
      },
      (response) => {
        const status = response.statusCode ?? 0;

        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = response.headers.location;
          response.resume();
          if (!location) {
            fail(new ResumeFetchError("ResumeURLUnreachable", 400));
            return;
          }
          finish({ kind: "redirect", location });
          return;
        }

        if (status < 200 || status >= 300) {
          response.resume();
          fail(new ResumeFetchError("ResumeURLUnreachable", 400));
          return;
        }

        const declared = Number(response.headers["content-length"]);
        if (Number.isFinite(declared) && declared > MAX_RESUME_BYTES) {
          abort(new ResumeFetchError("ResumeTooLarge", 413));
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;

        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESUME_BYTES) {
            abort(new ResumeFetchError("ResumeTooLarge", 413));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () =>
          finish({ kind: "body", body: Buffer.concat(chunks) }),
        );
        response.on("error", fail);
      },
    );

    // Settle first, then tear down: destroying the request races an
    // ECONNRESET onto the error handler, which would mask the real reason.
    const abort = (error: ResumeFetchError) => {
      fail(error);
      request.destroy();
    };

    const timer = setTimeout(
      () => abort(new ResumeFetchError("ResumeFetchTimeout", 504)),
      budget,
    );

    request.on("timeout", () =>
      abort(new ResumeFetchError("ResumeFetchTimeout", 504)),
    );
    request.on("error", () =>
      fail(new ResumeFetchError("ResumeURLUnreachable", 400)),
    );
    request.end();
  });
}

/**
 * Downloads a resume from a caller-supplied URL, refusing anything that points
 * at private space and bounding the transfer in both time and bytes.
 */
export async function fetchRemoteResume(rawUrl: string): Promise<Buffer> {
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;
  let target = parseResumeUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const address = await resolvePinnedAddress(target);
    const result = await requestHop(target, address, deadline);

    if (result.kind === "body") return result.body;

    // Re-validate from scratch: a redirect is a brand new caller-supplied URL.
    target = parseResumeUrl(new URL(result.location, target).toString());
  }

  throw new ResumeFetchError("TooManyRedirects", 400);
}
