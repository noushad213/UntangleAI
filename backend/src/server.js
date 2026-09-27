const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { createApp } = require("./app");
const { connectDB } = require("./config/db");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    const app = createApp();
    const server = app.listen(PORT, () => {
      logger.info(`CivicPath backend listening on port ${PORT}`);
    });

    const shutdown = (signal) => {
      logger.info(`Received ${signal}, shutting down`);
      server.close(() => process.exit(0));
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  }
}

start();
