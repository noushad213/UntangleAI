const mongoose = require("mongoose");
const CivicQuery = require("../models/CivicQuery");
const logger = require("../utils/logger");

const STOP_WORDS = new Set([
  // English common functional / conversational filler words
  "i", "want", "to", "how", "do", "in", "and", "that", "a", "an", "the", "of", "for", "is", "are",
  "am", "me", "my", "we", "please", "can", "have", "what", "where", "when", "why", "which", "with",
  "on", "at", "by", "from", "as", "so", "or", "be", "it", "this", "there", "here", "apply", "get",
  "need", "know", "tell", "help", "give", "take", "any", "some", "all",
  // Hindi / Hinglish filler words
  "karna", "kare", "karo", "kaise", "kya", "hai", "hain", "ho", "ko", "ke", "ki", "se", "par",
  "chahiye", "karwana", "karwane",
  // Marathi filler words
  "kasa", "kase", "aahe", "ahet", "mala", "kay", "karayche", "karava"
]);

function extractContentTokens(str) {
  if (typeof str !== "string") return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function normalizeQuery(rawQuery) {
  if (typeof rawQuery !== "string") return "";
  return rawQuery
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Searches the pre-ingested CivicQuery collection for an exact or high-confidence text match.
 *
 * @param {string} rawQuery
 * @param {string|null} municipalitySlug
 * @returns {Promise<{issueKey: string, intent: string, keywords: string[], confidence: number, classifier: string}|null>}
 */
async function matchCivicQuery(rawQuery, municipalitySlug = null) {
  if (
    typeof rawQuery !== "string" ||
    !rawQuery.trim() ||
    !mongoose.connection ||
    mongoose.connection.readyState !== 1 ||
    typeof CivicQuery.findOne !== "function"
  ) {
    return null;
  }

  const normalized = normalizeQuery(rawQuery);
  if (!normalized) return null;

  try {
    const slugFilter = municipalitySlug
      ? { $or: [{ municipalitySlug }, { municipalitySlug: null }] }
      : { municipalitySlug: null };

    // 1. Fast exact normalized query match (<5ms)
    const exactMatch = await CivicQuery.findOne({
      normalizedQuery: normalized,
      ...slugFilter,
    });

    if (exactMatch) {
      CivicQuery.updateOne(
        { _id: exactMatch._id },
        { $inc: { usageCount: 1 } }
      ).catch(() => {});

      return {
        issueKey: exactMatch.issueKey,
        intent: exactMatch.intentLabel,
        keywords: Array.isArray(exactMatch.keywords) ? exactMatch.keywords : [],
        confidence: 1.0,
        classifier: "civic_query_exact",
      };
    }

    // 2. Text index search for content-bearing terms
    const contentTokens = extractContentTokens(rawQuery);
    if (contentTokens.length === 0) {
      return null;
    }

    const searchStr = contentTokens.join(" ");
    const textMatches = await CivicQuery.find(
      {
        $text: { $search: searchStr },
        ...slugFilter,
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(1);

    if (textMatches && textMatches.length > 0) {
      const best = textMatches[0];
      const score = typeof best.get === "function" ? best.get("score") : best.score;

      // Extract candidate domain words (query tokens + keywords)
      const candidateTokens = extractContentTokens(best.queryText || best.normalizedQuery);
      const candidateKeywords = (best.keywords || []).flatMap((k) => extractContentTokens(k));
      const domainSet = new Set([...candidateTokens, ...candidateKeywords]);

      // Calculate content overlap: how many of the user's content tokens exist in the candidate
      const matchedTokens = contentTokens.filter((t) => domainSet.has(t));
      const overlapRatio = matchedTokens.length / contentTokens.length;

      // Require both a solid text score and at least 60% semantic content-token overlap
      if (typeof score === "number" && score >= 2.0 && overlapRatio >= 0.6) {
        CivicQuery.updateOne(
          { _id: best._id },
          { $inc: { usageCount: 1 } }
        ).catch(() => {});

        return {
          issueKey: best.issueKey,
          intent: best.intentLabel,
          keywords: Array.isArray(best.keywords) ? best.keywords : [],
          confidence: Math.min(0.95, Number((score / 4).toFixed(2))),
          classifier: "civic_query_text",
        };
      }
    }
  } catch (err) {
    logger.warn("CivicQuery lookup skipped due to index/query error", {
      error: err.message,
    });
  }

  return null;
}

/**
 * Self-learning: Records a newly classified civic query into the router collection.
 */
async function recordLearnedQuery({
  queryText,
  issueKey,
  intentLabel,
  category = "General",
  language = "en",
  municipalitySlug = null,
  keywords = [],
}) {
  if (
    !queryText ||
    !issueKey ||
    !mongoose.connection ||
    mongoose.connection.readyState !== 1 ||
    typeof CivicQuery.findOneAndUpdate !== "function"
  ) {
    return;
  }

  const normalizedQuery = normalizeQuery(queryText);
  if (!normalizedQuery) return;

  try {
    await CivicQuery.findOneAndUpdate(
      {
        normalizedQuery,
        municipalitySlug,
      },
      {
        queryText: queryText.trim(),
        normalizedQuery,
        issueKey,
        intentLabel,
        category,
        queryLanguage: language,
        municipalitySlug,
        $addToSet: { keywords: { $each: keywords } },
        $inc: { usageCount: 1 },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.warn("Could not record learned civic query", { error: err.message });
  }
}

module.exports = {
  normalizeQuery,
  matchCivicQuery,
  recordLearnedQuery,
};
