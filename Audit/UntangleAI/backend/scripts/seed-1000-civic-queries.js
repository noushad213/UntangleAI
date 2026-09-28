const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB } = require("../src/config/db");
const CivicQuery = require("../src/models/CivicQuery");
const benchmarkQueries = require("../src/data/benchmark1000Queries.json");
const { normalizeQuery } = require("../src/services/queryRouter.service");

async function seedBenchmarkQueries() {
  await connectDB();
  console.log(`Seeding ${benchmarkQueries.length} benchmark queries into CivicQuery router...`);

  let count = 0;
  for (const item of benchmarkQueries) {
    if (item.expectedStatus !== "RESOLVED" || !item.expectedIssueKey) {
      continue;
    }

    const normalized = normalizeQuery(item.query);
    if (!normalized) continue;

    const isDevanagari = /[\u0900-\u097F]/.test(item.query);

    await CivicQuery.findOneAndUpdate(
      {
        normalizedQuery: normalized,
        municipalitySlug: null,
      },
      {
        queryText: item.query.trim(),
        normalizedQuery: normalized,
        issueKey: item.expectedIssueKey,
        intentLabel: item.category,
        municipalitySlug: null,
        keywords: [item.expectedIssueKey.replace(/_/g, " ")],
        isDevanagari,
        confidence: 1,
        source: "curated",
        usageCount: 1,
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    count++;
  }

  console.log(`Successfully seeded/updated ${count} civic query router mappings in MongoDB!`);
  process.exit(0);
}

seedBenchmarkQueries().catch((err) => {
  console.error(err);
  process.exit(1);
});
