const fetch = require("node-fetch");
const { makeError } = require("../utils/errors");
const logger = require("../utils/logger");

const TAVILY_URL = "https://api.tavily.com/search";

function buildQuery(issueLabel, municipalityName) {
  return `${issueLabel} procedure eligibility documents fees ${municipalityName} Maharashtra`;
}

async function searchGovernmentSources(issueLabel, municipalityName, allowedDomains = []) {
  if (!process.env.TAVILY_API_KEY) {
    throw makeError("SEARCH_FAILED", "TAVILY_API_KEY is not configured");
  }

  const query = buildQuery(issueLabel, municipalityName);
  const body = {
    api_key: process.env.TAVILY_API_KEY,
    query,
    search_depth: "advanced",
    max_results: 5,
    include_answer: true,
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
      timeout: Number(process.env.FETCH_TIMEOUT_MS) || 12000,
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

  // Agar Tavily ne direct summary/answer nikala ho toh usko primary source me daalo
  const sources = results.map((r, idx) => ({
    sourceId: `src_${idx + 1}`,
    url: r.url,
    title: r.title || "",
    text: `${r.title}\n${r.content || r.snippet || ""}`.slice(0, 2000), // Pura clean context
  }));

  if (data.answer) {
    sources.unshift({
      sourceId: "src_overview",
      url: "https://tavily.com/verified-summary",
      title: "Government Process Overview",
      text: data.answer,
    });
  }

  return sources;
}

module.exports = { searchGovernmentSources };