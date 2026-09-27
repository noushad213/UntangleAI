function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function buildTermFrequency(tokens) {
  const frequency = new Map();

  for (const token of tokens) {
    frequency.set(
      token,
      (frequency.get(token) || 0) + 1
    );
  }

  return frequency;
}

function scoreChunk(
  chunk,
  query,
  issueKeywords = []
) {
  const chunkText =
    chunk.text ||
    chunk.extractedText ||
    "";

  if (!chunkText.trim()) {
    return 0;
  }

  const queryTokens = tokenize(query);

  const keywordTokens = issueKeywords.flatMap(
    tokenize
  );

  const chunkTokens = tokenize(chunkText);

  const chunkFrequency =
    buildTermFrequency(chunkTokens);

  const uniqueQueryTokens = [
    ...new Set(queryTokens),
  ];

  const uniqueKeywordTokens = [
    ...new Set(keywordTokens),
  ];

  let score = 0;

  for (const token of uniqueQueryTokens) {
    if (chunkFrequency.has(token)) {
      score += 3;
    }
  }

  for (const token of uniqueKeywordTokens) {
    if (chunkFrequency.has(token)) {
      score += 2;
    }
  }

  const normalizedChunk =
    chunkText.toLowerCase();

  const normalizedQuery =
    String(query || "")
      .trim()
      .toLowerCase();

  if (
    normalizedQuery.length > 3 &&
    normalizedChunk.includes(normalizedQuery)
  ) {
    score += 10;
  }

  const matchedQueryTerms =
    uniqueQueryTokens.filter((token) =>
      chunkFrequency.has(token)
    );

  if (matchedQueryTerms.length >= 2) {
    score +=
      matchedQueryTerms.length * 2;
  }

  return score;
}

function rankChunks(
  chunks,
  query,
  issueKeywords = []
) {
  return chunks
    .map((chunk, index) => ({
      ...chunk,
      relevanceScore: scoreChunk(
        chunk,
        query,
        issueKeywords
      ),
      originalIndex: index,
    }))
    .sort((a, b) => {
      if (
        b.relevanceScore !==
        a.relevanceScore
      ) {
        return (
          b.relevanceScore -
          a.relevanceScore
        );
      }

      return (
        a.originalIndex -
        b.originalIndex
      );
    });
}

function selectTopChunks(
  chunks,
  query,
  issueKeywords = [],
  maxChunks = 4
) {
  const ranked = rankChunks(
    chunks,
    query,
    issueKeywords
  );

  return ranked
    .filter(
      (chunk) =>
        chunk.relevanceScore > 0
    )
    .slice(0, maxChunks);
}

module.exports = {
  tokenize,
  buildTermFrequency,
  scoreChunk,
  rankChunks,
  selectTopChunks,
};