const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { connectDB } = require("../src/config/db");
const Municipality = require("../src/models/Municipality");
const Source = require("../src/models/Source");
const extractionService = require("../src/services/extraction.service");
const services = require("../src/data/maharashtraServicesCatalog.json");
const logger = require("../src/utils/logger");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    municipalitySlug: null,
    issueKey: null,
    limit: 50,
    force: false,
    generateWorkflows: false,
  };

  for (const arg of args) {
    if (arg.startsWith("--municipality=")) {
      options.municipalitySlug = arg.split("=")[1].trim().toLowerCase();
    } else if (arg.startsWith("--issue=")) {
      options.issueKey = arg.split("=")[1].trim();
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.split("=")[1].trim(), 10);
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--generate-workflows") {
      options.generateWorkflows = true;
    }
  }

  return options;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBatchIngestion() {
  const options = parseArgs();
  logger.info("Starting batch civic source ingestion", options);

  await connectDB();

  // Find target municipalities
  const query = options.municipalitySlug
    ? { slug: options.municipalitySlug }
    : { isActive: true };

  const municipalities = await Municipality.find(query);
  if (municipalities.length === 0) {
    logger.error("No matching municipalities found in database. Run 'npm run seed' first.");
    process.exit(1);
  }

  const targetServices = options.issueKey
    ? services.filter((s) => s.issueKey === options.issueKey)
    : services;

  if (targetServices.length === 0) {
    logger.error(`No service matching issueKey: ${options.issueKey}`);
    process.exit(1);
  }

  const stats = {
    totalServices: targetServices.length,
    municipalitiesCount: municipalities.length,
    urlsProcessed: 0,
    alreadyCached: 0,
    successfullyIngested: 0,
    failedIngestions: 0,
  };

  for (const municipality of municipalities) {
    logger.info(`\n=== Processing Municipality: ${municipality.name} (${municipality.slug}) ===`);

    for (const service of targetServices) {
      logger.info(`Processing civic issue: ${service.label} [${service.issueKey}]`);
      const canonicalUrls = Array.isArray(service.canonicalUrls) ? service.canonicalUrls : [];

      for (const rawUrl of canonicalUrls) {
        if (stats.urlsProcessed >= options.limit) {
          logger.info(`Hit limit of ${options.limit} URLs processed. Stopping.`);
          break;
        }

        const normalizedUrl = rawUrl.trim();
        let domain;
        try {
          domain = new URL(normalizedUrl).hostname;
        } catch {
          logger.warn(`Skipping invalid URL: ${normalizedUrl}`);
          continue;
        }

        stats.urlsProcessed += 1;

        // Check existing cache
        let existingSource = await Source.findOne({
          municipalityId: municipality._id,
          url: normalizedUrl,
        });

        if (
          existingSource &&
          !options.force &&
          existingSource.extractionStatus === "success" &&
          existingSource.quality?.usable
        ) {
          logger.info(`[CACHE HIT] Source already usable: ${normalizedUrl}`);
          stats.alreadyCached += 1;

          // Ensure issueKey is mapped
          if (!existingSource.issueKeys || !existingSource.issueKeys.includes(service.issueKey)) {
            await Source.updateOne(
              { _id: existingSource._id },
              { $addToSet: { issueKeys: service.issueKey } }
            );
          }
          continue;
        }

        logger.info(`[FETCHING] Ingesting official portal: ${normalizedUrl}`);

        try {
          // Pause slightly between requests to respect government servers
          await delay(1200);

          const extracted = await extractionService.fetchAndExtract(
            normalizedUrl,
            municipality.allowedDomains
          );

          await Source.findOneAndUpdate(
            {
              municipalityId: municipality._id,
              url: normalizedUrl,
            },
            {
              municipalityId: municipality._id,
              url: normalizedUrl,
              domain,
              documentType: extracted.documentType,
              extractedText: extracted.extractedText,
              contentHash: extracted.contentHash,
              resolvedUrl: extracted.finalUrl,
              retrievalMethod: extracted.retrievalMethod,
              extractionMethod: extracted.extractionMethod,
              pages: extracted.pages,
              chunks: extracted.chunks,
              quality: extracted.quality,
              attemptedUrls: extracted.attemptedUrls,
              $addToSet: { issueKeys: service.issueKey },
              title: service.label,
              fetchedAt: new Date(),
              lastCheckedAt: new Date(),
              extractionStatus: "success",
              extractionError: null,
            },
            { upsert: true, new: true }
          );

          stats.successfullyIngested += 1;
          logger.info(
            `[INGESTED] ${normalizedUrl} - ${extracted.extractedText?.length || 0} chars, ` +
            `${extracted.chunks?.length || 0} chunks, quality score: ${extracted.quality?.score || 0}`
          );
        } catch (err) {
          stats.failedIngestions += 1;
          logger.warn(`[INGESTION ERROR] Failed to fetch ${normalizedUrl}: ${err.message}`);

          await Source.findOneAndUpdate(
            {
              municipalityId: municipality._id,
              url: normalizedUrl,
            },
            {
              municipalityId: municipality._id,
              url: normalizedUrl,
              domain,
              $addToSet: { issueKeys: service.issueKey },
              extractionStatus: "failed",
              extractionError: err.message,
              lastCheckedAt: new Date(),
            },
            { upsert: true }
          );
        }
      }
    }
  }

  logger.info("\n=== Batch Ingestion Summary ===");
  logger.info(`Municipalities Processed: ${stats.municipalitiesCount}`);
  logger.info(`Services Processed:       ${stats.totalServices}`);
  logger.info(`URLs Processed:           ${stats.urlsProcessed}`);
  logger.info(`Already Cached (Usable):  ${stats.alreadyCached}`);
  logger.info(`Successfully Ingested:    ${stats.successfullyIngested}`);
  logger.info(`Failed Ingestions:        ${stats.failedIngestions}`);
  logger.info("================================\n");

  process.exit(0);
}

runBatchIngestion().catch((err) => {
  logger.error("Batch ingestion fatal failure", { error: err.message, stack: err.stack });
  process.exit(1);
});
