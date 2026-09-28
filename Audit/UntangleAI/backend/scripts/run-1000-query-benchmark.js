const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const fs = require("fs");
const { connectDB } = require("../src/config/db");
const { resolveWorkflowForQuery } = require("../src/services/workflow.service");
const benchmarkQueries = require("../src/data/benchmark1000Queries.json");

const BATCH_SIZE = 100;
const MUNICIPALITIES = ["mumbai", "pune"];

async function runBenchmark() {
  await connectDB();
  console.log("=========================================================");
  console.log(`STARTING BENCHMARK: 1,000 CITIZEN QUERIES STRESS TEST`);
  console.log(`Total queries to test: ${benchmarkQueries.length}`);
  console.log(`Batch size: ${BATCH_SIZE} (10 batches total, executed one by one)`);
  console.log("=========================================================\n");

  const results = [];
  const batchStats = [];
  let globalPassed = 0;
  let globalFailed = 0;
  let globalCacheHits = 0;
  let globalClarifications = 0;
  let globalOutOfScope = 0;
  let totalDurationMs = 0;

  const startTime = Date.now();

  for (let b = 0; b < benchmarkQueries.length; b += BATCH_SIZE) {
    const batchNum = Math.floor(b / BATCH_SIZE) + 1;
    const batchQueries = benchmarkQueries.slice(b, b + BATCH_SIZE);
    console.log(`>>> Starting Batch ${batchNum}/10 (Queries ${b + 1} to ${b + batchQueries.length})...`);

    let batchPassed = 0;
    let batchFailed = 0;
    let batchCacheHits = 0;
    let batchClarifications = 0;
    let batchOutOfScope = 0;
    let batchDurationMs = 0;

    for (let i = 0; i < batchQueries.length; i++) {
      const item = batchQueries[i];
      const municipality = MUNICIPALITIES[(b + i) % MUNICIPALITIES.length];
      const qStart = Date.now();
      let queryStatus = "UNKNOWN";
      let errorDetail = null;
      let fromCache = false;
      let issueResolved = null;

      try {
        const res = await resolveWorkflowForQuery(item.query, municipality);
        const duration = Date.now() - qStart;
        batchDurationMs += duration;
        fromCache = Boolean(res.fromCache);
        issueResolved = res.classification?.issueKey;

        if (fromCache) {
          batchCacheHits++;
          globalCacheHits++;
        }

        if (item.expectedStatus === "RESOLVED") {
          queryStatus = "PASS";
          batchPassed++;
          globalPassed++;
        } else {
          // Expected an error/clarification, but got a resolved workflow
          queryStatus = "UNEXPECTED_RESOLVED";
          batchFailed++;
          globalFailed++;
          errorDetail = `Expected ${item.expectedStatus} but resolved to ${issueResolved}`;
        }

        results.push({
          id: item.id,
          query: item.query,
          municipality,
          expectedStatus: item.expectedStatus,
          status: queryStatus,
          issueKey: issueResolved,
          fromCache,
          durationMs: duration,
        });
      } catch (err) {
        const duration = Date.now() - qStart;
        batchDurationMs += duration;

        if (err.code === "CLARIFICATION_REQUIRED") {
          batchClarifications++;
          globalClarifications++;
          if (item.expectedStatus === "CLARIFICATION_REQUIRED") {
            queryStatus = "PASS";
            batchPassed++;
            globalPassed++;
          } else {
            queryStatus = "UNEXPECTED_CLARIFICATION";
            batchFailed++;
            globalFailed++;
            errorDetail = err.message;
          }
        } else if (err.code === "OUT_OF_SCOPE") {
          batchOutOfScope++;
          globalOutOfScope++;
          if (item.expectedStatus === "OUT_OF_SCOPE") {
            queryStatus = "PASS";
            batchPassed++;
            globalPassed++;
          } else {
            queryStatus = "UNEXPECTED_OUT_OF_SCOPE";
            batchFailed++;
            globalFailed++;
            errorDetail = err.message;
          }
        } else {
          queryStatus = "FAIL";
          batchFailed++;
          globalFailed++;
          errorDetail = `${err.code || err.name}: ${err.message}`;
        }

        results.push({
          id: item.id,
          query: item.query,
          municipality,
          expectedStatus: item.expectedStatus,
          status: queryStatus,
          errorCode: err.code,
          error: errorDetail,
          durationMs: duration,
        });

        if (queryStatus !== "PASS") {
          console.warn(`  [FAIL Q#${item.id}] "${item.query}" -> ${errorDetail}`);
        }
      }
    }

    totalDurationMs += batchDurationMs;
    const avgBatchDuration = Math.round(batchDurationMs / batchQueries.length);

    batchStats.push({
      batchNum,
      queriesCount: batchQueries.length,
      passed: batchPassed,
      failed: batchFailed,
      cacheHits: batchCacheHits,
      clarifications: batchClarifications,
      outOfScope: batchOutOfScope,
      avgDurationMs: avgBatchDuration,
    });

    console.log(
      `--- Batch ${batchNum}/10 Finished: ${batchPassed}/${batchQueries.length} Passed | ` +
      `Cache Hits: ${batchCacheHits} | Clarifications: ${batchClarifications} | OutOfScope: ${batchOutOfScope} | ` +
      `Avg Latency: ${avgBatchDuration}ms\n`
    );
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgQueryLatency = Math.round(totalDurationMs / benchmarkQueries.length);
  const passRate = ((globalPassed / benchmarkQueries.length) * 100).toFixed(1);

  console.log("=========================================================");
  console.log("             1,000 QUERIES BENCHMARK COMPLETED           ");
  console.log("=========================================================");
  console.log(`Total Queries:         ${benchmarkQueries.length}`);
  console.log(`Total Passed:          ${globalPassed} (${passRate}%)`);
  console.log(`Total Failed:          ${globalFailed}`);
  console.log(`Total Cache Hits:      ${globalCacheHits}`);
  console.log(`Clarifications:        ${globalClarifications}`);
  console.log(`Out-of-Scope Handled:  ${globalOutOfScope}`);
  console.log(`Average Latency:       ${avgQueryLatency} ms / query`);
  console.log(`Total Execution Time:  ${totalTimeSec} seconds`);
  console.log("=========================================================\n");

  // Write detailed summary JSON
  const summaryReport = {
    totalQueries: benchmarkQueries.length,
    passed: globalPassed,
    failed: globalFailed,
    passRate: `${passRate}%`,
    cacheHits: globalCacheHits,
    clarifications: globalClarifications,
    outOfScope: globalOutOfScope,
    avgLatencyMs: avgQueryLatency,
    totalTimeSeconds: totalTimeSec,
    batchStats,
  };

  const reportPath = path.resolve(__dirname, "../src/data/benchmark1000Results.json");
  fs.writeFileSync(reportPath, JSON.stringify(summaryReport, null, 2), "utf8");
  console.log(`Results saved to ${reportPath}`);

  process.exit(globalFailed > 0 ? 1 : 0);
}

runBenchmark().catch((err) => {
  console.error("Benchmark crashed:", err);
  process.exit(1);
});
