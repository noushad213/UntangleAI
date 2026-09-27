const municipalityService = require("../services/municipality.service");
const { validateMunicipalityCreate, requireString } = require("../validators/request.validator");

async function create(req, res, next) {
  try {
    const data = validateMunicipalityCreate(req.body);
    const municipality = await municipalityService.createMunicipality(data);
    res.status(201).json({ municipality });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const municipalities = await municipalityService.listMunicipalities();
    res.json({ municipalities });
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const slug = requireString(req.params.slug, "slug");
    const municipality = await municipalityService.getMunicipalityBySlug(slug);
    res.json({ municipality });
  } catch (err) {
    next(err);
  }
}

async function addIssue(req, res, next) {
  try {
    const slug = requireString(req.params.slug, "slug");
    const issueKey = requireString(req.body.issueKey, "issueKey");
    const label = requireString(req.body.label, "label");
    const keywords = Array.isArray(req.body.keywords) ? req.body.keywords : [];
    const municipality = await municipalityService.addIssueToCatalog(slug, { issueKey, label, keywords });
    res.status(201).json({ municipality });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getBySlug, addIssue };
