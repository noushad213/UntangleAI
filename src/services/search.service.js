const fetch = require("node-fetch");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");

const TAVILY_URL = "https://api.tavily.com/search";

/**
 * Builds a focused query. Domain restriction is applied via Tavily's
 * `include_domains`, not by string-stuffing the query.
 */
function buildQuery(issueLabel, municipalityName) {
  return `${issueLabel} procedure official ${municipalityName} Maharashtra`;
}

/**
 * Discovers candidate official source URLs for an issue.
 * Results are CANDIDATES ONLY — callers must still fetch + validate + verify.
 *
 * @param {string} issueLabel
 * @param {string} municipalityName
 * @param {string[]} allowedDomains - restricts search when the municipality has known domains
 * @returns {Promise<Array<{url:string, title:string, snippet:string}>>}
 */
async function searchGovernmentSources(issueLabel, municipalityName, allowedDomains = []) {
  if (!process.env.TAVILY_API_KEY) {
    throw makeError("SEARCH_FAILED", "TAVILY_API_KEY is not configured");
  }

  const query = buildQuery(issueLabel, municipalityName);
  const body = {
    api_key: process.env.TAVILY_API_KEY,
    query,
    search_depth: "basic",
    max_results: 5,
  };
  if (allowedDomains.length > 0) {
    body.include_domains = allowedDomains;
  }

  let res;
  try {
    res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeout: Number(process.env.FETCH_TIMEOUT_MS) || 8000,
    });
  } catch (err) {
    logger.error("Tavily request failed", { error: err.message });
    throw makeError("SEARCH_FAILED", "Tavily request failed");
  }

  if (!res.ok) {
    throw makeError("SEARCH_FAILED", `Tavily returned status ${res.status}`);
  }

  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];

  // Normalize to a provider-agnostic shape so callers never see Tavily's raw format.
  return results.map((r) => ({
    url: r.url,
    title: r.title || "",
    snippet: (r.content || "").slice(0, 500),
  }));
}

module.exports = { searchGovernmentSources };
