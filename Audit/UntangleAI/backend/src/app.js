const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const municipalityRoutes = require("./routes/municipality.routes");
const workflowRoutes = require("./routes/workflow.routes");
const queryRoutes = require("./routes/query.routes");
const officeRoutes = require("./routes/office.routes");
const { createDocumentVerificationRouter } = require("./features/document-verification");
const { notFoundHandler, errorHandler } = require("./utils/errorHandler");
const { createCorsOptions } = require("./middleware/security");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors(createCorsOptions()));
  app.use(express.json({ limit: "200kb" }));
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use("/api/health", healthRoutes);
  app.use("/api/municipalities", municipalityRoutes);
  app.use("/api/workflows", workflowRoutes);
  app.use("/api/query", queryRoutes);
  app.use("/api/offices", officeRoutes);
  app.use("/api/documents", createDocumentVerificationRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
