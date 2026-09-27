const { makeError } = require("../utils/errors");

function requireString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw makeError("INVALID_REQUEST", `${field} is required and must be a non-empty string`);
  }
  return value.trim();
}

function validateQueryRequest(body) {
  const query = requireString(body.query, "query");
  const municipalitySlug = requireString(body.municipalitySlug, "municipalitySlug");
  if (query.length > 500) {
    throw makeError("INVALID_REQUEST", "query is too long (max 500 chars)");
  }
  return { query, municipalitySlug };
}

function validateMunicipalityCreate(body) {
  const name = requireString(body.name, "name");
  const slug = requireString(body.slug, "slug").toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw makeError("INVALID_REQUEST", "slug must be lowercase alphanumeric with hyphens only");
  }
  const allowedDomains = Array.isArray(body.allowedDomains) ? body.allowedDomains : [];
  return { name, slug, district: body.district || "", allowedDomains };
}

module.exports = { requireString, validateQueryRequest, validateMunicipalityCreate };
