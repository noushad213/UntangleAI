const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { connectDB } = require("../src/config/db");
const Municipality = require("../src/models/Municipality");
const { resolveWorkflowForQuery } = require("../src/services/workflow.service");

const TEST_QUERIES = [
  { issueKey: "commercial_kitchen_cloud_kitchen_approval", query: "how to get approval for cloud kitchen and dhaba" },
  { issueKey: "saas_tech_business_setup", query: "how to start a saas company in maharashtra and register" },
  { issueKey: "commercial_transport_delivery_permit", query: "how to get delivery fleet permit for commercial goods" },
  { issueKey: "visa_and_frro_guidance", query: "i want to apply for visa and foreign registration" },
  { issueKey: "passport_application_renewal", query: "how to apply for passport online and renewal" },
];

async function warmExpanded() {
  await connectDB();
  const municipalities = await Municipality.find({ isActive: true });
  console.log(`Pre-warming 5 expanded workflows across ${municipalities.length} municipalities...`);

  for (const item of TEST_QUERIES) {
    for (const m of municipalities) {
      const start = Date.now();
      try {
        const res = await resolveWorkflowForQuery(item.query, m.slug);
        console.log(`[${m.slug}] ${item.issueKey}: OK (${Date.now() - start}ms) - Cache: ${res.fromCache} - Steps: ${res.workflow?.steps?.length}`);
      } catch (err) {
        console.error(`[${m.slug}] ${item.issueKey}: FAILED - ${err.message}`);
      }
    }
  }

  console.log("Pre-warming complete!");
  process.exit(0);
}

warmExpanded().catch((err) => {
  console.error("Warming failed:", err);
  process.exit(1);
});
