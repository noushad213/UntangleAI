const { resolveOfficeLocation } = require("../services/officeLocationService");

async function getOfficeByLocation(req, res, next) {
  try {
    const locationQuery = req.query.q || req.body.location || req.body.query;

    if (!locationQuery) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: 'q' or 'location'",
      });
    }

    const result = await resolveOfficeLocation(locationQuery);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { getOfficeByLocation };