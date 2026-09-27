const Municipality = require("../models/Municipality");
const { makeError } = require("../utils/errors");

/**
 * Normalize text into a stable issue key.
 *
 * Examples:
 * "Dog License"          -> "dog-license"
 * "Property Tax Payment" -> "property-tax-payment"
 * "Dog licence"          -> "dog-licence"
 */
function normalizeIssueKey(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  let key = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return key || null;
}

async function createMunicipality({
  name,
  slug,
  district,
  allowedDomains,
}) {
  const existing = await Municipality.findOne({ slug });

  if (existing) {
    throw makeError(
      "INVALID_REQUEST",
      `Municipality with slug '${slug}' already exists`
    );
  }

  return Municipality.create({
    name,
    slug,
    district,
    allowedDomains,
  });
}

async function getMunicipalityBySlug(slug) {
  const m = await Municipality.findOne({
    slug,
    isActive: true,
  });

  if (!m) {
    throw makeError(
      "MUNICIPALITY_NOT_FOUND",
      `No municipality found for slug '${slug}'`
    );
  }

  return m;
}

async function listMunicipalities() {
  return Municipality.find({
    isActive: true,
  }).select("name slug district").lean();
}

/**
 * Adds a known issue to the optional municipality catalog.
 *
 * The catalog is no longer a requirement for generating workflows.
 * It can still be used for predefined/common civic issues.
 */
async function addIssueToCatalog(
  slug,
  { issueKey, label, keywords }
) {
  const m = await getMunicipalityBySlug(slug);

  const normalizedKey =
    normalizeIssueKey(issueKey || label);

  if (!normalizedKey) {
    throw makeError(
      "INVALID_REQUEST",
      "A valid issueKey or label is required"
    );
  }

  const exists = m.issueCatalog.some(
    (i) => i.issueKey === normalizedKey
  );

  if (exists) {
    throw makeError(
      "INVALID_REQUEST",
      `issueKey '${normalizedKey}' already exists for ${slug}`
    );
  }

  m.issueCatalog.push({
    issueKey: normalizedKey,
    label: label || normalizedKey,
    keywords: keywords || [],
  });

  await m.save();

  return m;
}

/**
 * Finds an issue in the optional predefined catalog.
 *
 * This function is kept for backward compatibility.
 * It should NOT be used as a gate for new dynamic workflows.
 */
function findIssueInCatalog(
  municipality,
  issueKey
) {
  const normalizedKey =
    normalizeIssueKey(issueKey);

  const issue =
    municipality.issueCatalog.find(
      (i) =>
        i.issueKey === normalizedKey ||
        i.issueKey === issueKey
    );

  if (!issue) {
    throw makeError(
      "ISSUE_NOT_RECOGNIZED",
      `issueKey '${issueKey}' not recognized for this municipality`
    );
  }

  return issue;
}

/**
 * Resolves an issue dynamically.
 *
 * First checks the optional catalog.
 * If the issue is not present, creates a dynamic issue object.
 *
 * IMPORTANT:
 * This does NOT save the issue to Municipality.issueCatalog.
 * The generated workflow itself will be saved in Workflow collection
 * and will act as the cache.
 */
function resolveIssue(
  municipality,
  {
    issueKey,
    intent,
    keywords = [],
  }
) {
  const normalizedKey =
    normalizeIssueKey(
      issueKey || intent
    );

  if (!normalizedKey) {
    throw makeError(
      "ISSUE_NOT_RECOGNIZED",
      "Could not determine a valid civic issue from the query"
    );
  }

  // First try the optional predefined catalog.
  const catalogIssue =
    municipality.issueCatalog.find(
      (issue) =>
        issue.issueKey === normalizedKey ||
        normalizeIssueKey(issue.issueKey) ===
          normalizedKey
    );

  if (catalogIssue) {
    return {
      issueKey: catalogIssue.issueKey,
      label: catalogIssue.label,
      keywords:
        Array.isArray(catalogIssue.keywords)
          ? catalogIssue.keywords
          : [],
      source: "catalog",
    };
  }

  // No catalog entry.
  // Create a dynamic issue representation.
  const label =
    typeof intent === "string" &&
    intent.trim()
      ? intent.trim()
      : normalizedKey
          .split("-")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(" ");

  return {
    issueKey: normalizedKey,
    label,
    keywords: Array.isArray(keywords)
      ? keywords.filter(
          (keyword) =>
            typeof keyword === "string" &&
            keyword.trim()
        )
      : [],
    source: "dynamic",
  };
}

module.exports = {
  createMunicipality,
  getMunicipalityBySlug,
  listMunicipalities,
  addIssueToCatalog,
  findIssueInCatalog,
  resolveIssue,
  normalizeIssueKey,
};