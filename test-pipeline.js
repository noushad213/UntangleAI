require("dotenv").config();
const { searchGovernmentSources } = require("./src/services/search.service");
const { extractWorkflow } = require("./src/services/gemini.service");

async function testCurrentCode() {
  const query = "I want to open a small cloud kitchen and food delivery outlet in Andheri, Mumbai. What are the required licenses, documents, and step-by-step process?";
  const location = "Mumbai";

  console.log(`1. Searching sources for: "${query}"...`);
  const sources = await searchGovernmentSources(query, location);
  console.log(`✅ Sources found: ${sources.length}`);

  console.log("2. Running AI extraction...");
  const workflow = await extractWorkflow(query, sources);
  console.log("✅ Successfully generated steps:", workflow.steps.length);
  console.log(JSON.stringify(workflow, null, 2));
}

testCurrentCode();