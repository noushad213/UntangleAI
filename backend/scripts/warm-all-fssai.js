const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB } = require("../src/config/db");
const Municipality = require("../src/models/Municipality");
const { resolveWorkflowForQuery } = require("../src/services/workflow.service");

async function warmAllFSSAI() {
  await connectDB();
  const municipalities = await Municipality.find({ isActive: true });
  console.log(`Warming FSSAI workflow for ${municipalities.length} municipalities...`);

  for (const m of municipalities) {
    const start = Date.now();
    try {
      const res = await resolveWorkflowForQuery(
        "if i am selling vada pav and i have to do quality testing, how do i",
        m.slug
      );
      console.log(`[${m.slug}] OK (${Date.now() - start}ms) - From cache: ${res.fromCache} - Title: ${res.workflow?.title}`);
    } catch (err) {
      console.error(`[${m.slug}] FAILED:`, err.message);
    }
  }

  console.log("All municipalities processed!");
  process.exit(0);
}

warmAllFSSAI();
