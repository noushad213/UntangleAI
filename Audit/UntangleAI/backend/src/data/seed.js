const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { connectDB } = require("../config/db");
const Municipality = require("../models/Municipality");
const CivicQuery = require("../models/CivicQuery");
const samples = require("./sampleMunicipalities.json");
const services = require("./maharashtraServicesCatalog.json");
const queriesSeed = require("./civicQueriesSeed.json");
const { normalizeQuery } = require("../services/queryRouter.service");
const logger = require("../utils/logger");

async function seed() {
  await connectDB();

  // 1. Seed Municipalities with standard issue catalogs
  const standardCatalog = services.map((s) => ({
    issueKey: s.issueKey,
    label: s.label,
    keywords: Array.isArray(s.keywords) ? s.keywords : [],
  }));

  for (const m of samples) {
    const municipalityData = {
      ...m,
      issueCatalog: standardCatalog,
    };

    await Municipality.findOneAndUpdate(
      { slug: m.slug },
      municipalityData,
      { upsert: true, new: true }
    );
    logger.info(`Seeded municipality with ${standardCatalog.length} civic services: ${m.slug}`);
  }

  // 2. Seed CivicQuery Router dictionary
  try {
    await CivicQuery.collection.dropIndexes();
  } catch (err) {
    // Ignore if collection or index does not exist yet
  }
  await CivicQuery.syncIndexes();

  let totalQueriesSeeded = 0;
  for (const group of queriesSeed) {
    const queries = Array.isArray(group.queries) ? group.queries : [];

    for (const queryText of queries) {
      const normalized = normalizeQuery(queryText);
      if (!normalized) continue;

      const isDevanagari = /[\u0900-\u097F]/.test(queryText);

      await CivicQuery.findOneAndUpdate(
        {
          normalizedQuery: normalized,
          municipalitySlug: null,
        },
        {
          queryText: queryText.trim(),
          normalizedQuery: normalized,
          issueKey: group.issueKey,
          intentLabel: group.intentLabel,
          category: group.category || "General",
          queryLanguage: isDevanagari ? "mr" : "en",
          municipalitySlug: null,
          keywords: [group.issueKey, ...(normalized.split(" ").filter((w) => w.length >= 3))],
          isVerified: true,
        },
        { upsert: true }
      );
      totalQueriesSeeded += 1;
    }
  }

  logger.info(`Seeded ${totalQueriesSeeded} citizen query variations in CivicQuery router.`);
  logger.info("Seeding complete");
  process.exit(0);
}

seed().catch((err) => {
  logger.error("Seeding failed", { error: err.message });
  process.exit(1);
});
