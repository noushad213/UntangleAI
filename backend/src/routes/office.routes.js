const router = require("express").Router();
const { resolveOfficeLocation } = require("../services/geocoding.service");
const { createRateLimiter } = require("../middleware/security");

router.use(createRateLimiter({ windowMs: 60000, max: 15 }));
router.post("/lookup", async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    res.json(await resolveOfficeLocation(req.body?.query));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
