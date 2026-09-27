const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { connectDB } = require("../config/db");
const Municipality = require("../models/Municipality");
const samples = require("./sampleMunicipalities.json");
const logger = require("../utils/logger");

async function seed() {
  await connectDB();
  for (const m of samples) {
    await Municipality.findOneAndUpdate({ slug: m.slug }, m, { upsert: true, new: true });
    logger.info(`Seeded municipality: ${m.slug}`);
  }
  logger.info("Seeding complete");
  process.exit(0);
}

seed().catch((err) => {
  logger.error("Seeding failed", { error: err.message });
  process.exit(1);
});
