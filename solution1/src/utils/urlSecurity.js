const dns = require("dns").promises;
const net = require("net");
const { makeError } = require("./errors");

/**
 * Blocks private / loopback / link-local / reserved IP ranges.
 * Applied to every resolved address, not just the hostname string,
 * to stop DNS-rebinding-style SSRF.
 */
function isPrivateOrReservedIp(ip) {
  const type = net.isIP(ip);
  if (type === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  if (type === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
    return false;
  }
  return true; // not a valid IP at all -> treat as unsafe
}

/**
 * Validates a URL string is safe to fetch server-side.
 * Throws AppError(SOURCE_FETCH_FAILED) on any violation.
 *
 * @param {string} rawUrl
 * @param {string[]} allowedDomains - municipality-configured allowlist (exact or suffix match)
 * @returns {Promise<URL>} the parsed, validated URL
 */
async function assertSafeUrl(rawUrl, allowedDomains = []) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw makeError("SOURCE_FETCH_FAILED", "Malformed URL");
  }

  if (url.protocol !== "https:") {
    throw makeError("SOURCE_FETCH_FAILED", "Only HTTPS URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw makeError("SOURCE_FETCH_FAILED", "Local hostnames are not allowed");
  }

  if (allowedDomains.length > 0) {
    const ok = allowedDomains.some(
      (d) => hostname === d.toLowerCase() || hostname.endsWith(`.${d.toLowerCase()}`)
    );
    if (!ok) {
      throw makeError("SOURCE_FETCH_FAILED", `Domain ${hostname} is not in the allowed list`);
    }
  }

  // If the hostname is already a literal IP, validate directly.
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw makeError("SOURCE_FETCH_FAILED", "Refusing to fetch private/reserved IP");
    }
    return url;
  }

  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw makeError("SOURCE_FETCH_FAILED", "DNS resolution failed");
  }

  for (const { address } of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw makeError("SOURCE_FETCH_FAILED", "Hostname resolves to a private/reserved IP");
    }
  }

  return url;
}

module.exports = { assertSafeUrl, isPrivateOrReservedIp };
