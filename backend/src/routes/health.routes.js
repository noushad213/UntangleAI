const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

function isConfigured(value) {
  return typeof value === "string" && value.trim().length > 0 && !/^your_|^replace_with_/i.test(value.trim());
}

function getReadinessStatus(env = process.env, dbState = mongoose.connection.readyState) {
  const checks = {
    MONGO_URI: dbState === 1 && isConfigured(env.MONGO_URI),
    TAVILY_API_KEY: isConfigured(env.TAVILY_API_KEY),
    AI_PROVIDER: isConfigured(env.GEMINI_API_KEY) || isConfigured(env.GROQ_API_KEY),
    ADMIN_API_TOKEN: isConfigured(env.ADMIN_API_TOKEN),
  };
  return {
    generationReady: checks.MONGO_URI && checks.TAVILY_API_KEY && checks.AI_PROVIDER,
    reviewReady: checks.ADMIN_API_TOKEN,
    missing: Object.entries(checks).filter(([, ready]) => !ready).map(([name]) => name),
  };
}

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    dbState: mongoose.connection.readyState, // 1 = connected
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

router.get("/ready", (req, res) => {
  const readiness = getReadinessStatus();
  res.status(readiness.generationReady ? 200 : 503).json(readiness);
});

module.exports = router;
module.exports.getReadinessStatus = getReadinessStatus;
