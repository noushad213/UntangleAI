const Municipality = require("../models/Municipality");
const { makeError } = require("../utils/errors");

async function createMunicipality({ name, slug, district, allowedDomains }) {
  const existing = await Municipality.findOne({ slug });
  if (existing) {
    throw makeError("INVALID_REQUEST", `Municipality with slug '${slug}' already exists`);
  }
  return Municipality.create({ name, slug, district, allowedDomains });
}

async function getMunicipalityBySlug(slug) {
  const m = await Municipality.findOne({ slug, isActive: true });
  if (!m) {
    throw makeError("MUNICIPALITY_NOT_FOUND", `No municipality found for slug '${slug}'`);
  }
  return m;
}

async function listMunicipalities() {
  return Municipality.find({ isActive: true }).select("name slug district").lean();
}

async function addIssueToCatalog(slug, { issueKey, label, keywords }) {
  const m = await getMunicipalityBySlug(slug);
  const exists = m.issueCatalog.some((i) => i.issueKey === issueKey);
  if (exists) {
    throw makeError("INVALID_REQUEST", `issueKey '${issueKey}' already exists for ${slug}`);
  }
  m.issueCatalog.push({ issueKey, label, keywords: keywords || [] });
  await m.save();
  return m;
}

function findIssueInCatalog(municipality, issueKey) {
  const issue = municipality.issueCatalog.find((i) => i.issueKey === issueKey);
  if (!issue) {
    throw makeError("ISSUE_NOT_RECOGNIZED", `issueKey '${issueKey}' not recognized for this municipality`);
  }
  return issue;
}

module.exports = {
  createMunicipality,
  getMunicipalityBySlug,
  listMunicipalities,
  addIssueToCatalog,
  findIssueInCatalog,
};
