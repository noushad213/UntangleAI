const express = require("express");
const controller = require("../controllers/municipality.controller");
const { requireAdmin } = require("../middleware/security");

const router = express.Router();

router.post("/", requireAdmin, controller.create);
router.get("/", controller.list);
router.get("/:slug", controller.getBySlug);
router.post("/:slug/issues", requireAdmin, controller.addIssue);

module.exports = router;
