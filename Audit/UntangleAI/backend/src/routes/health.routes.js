const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    dbState: mongoose.connection.readyState, // 1 = connected
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
