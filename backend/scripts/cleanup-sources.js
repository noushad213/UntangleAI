const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB } = require("../src/config/db");
const Source = require("../src/models/Source");

async function cleanup() {
  await connectDB();
  console.log("Connected to MongoDB, cleaning contaminated sources...");

  const del = await Source.deleteMany({
    issueKeys: "food_safety_fssai_registration",
    url: { $ne: "https://foscos.fssai.gov.in/guidelines/petty-food-vendor-quality-testing" },
  });

  console.log("Deleted contaminated food_safety sources:", del.deletedCount);

  // Check remaining sources for food_safety_fssai_registration
  const remaining = await Source.find({ issueKeys: "food_safety_fssai_registration" });
  console.log("Remaining valid sources count:", remaining.length);
  remaining.forEach((s) => console.log(" -", s.url, `(${s.chunks?.length} chunks)`));

  process.exit(0);
}

cleanup().catch((err) => {
  console.error(err);
  process.exit(1);
});
