const express = require("express");
const controller = require("../controllers/workflow.controller");
const {
  createRateLimiter,
  requireAdminForForceRefresh,
} = require("../middleware/security");

const router = express.Router();

const queryRateLimiter = createRateLimiter({
  windowMs: Number(process.env.QUERY_RATE_WINDOW_MS) || 60_000,
  max: Number(process.env.QUERY_RATE_MAX) || 10,
});

router.post("/", queryRateLimiter, requireAdminForForceRefresh, controller.query);

module.exports = router;
