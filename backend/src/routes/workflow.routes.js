const express = require("express");
const controller = require("../controllers/workflow.controller");
const { requireAdmin } = require("../middleware/security");

const router = express.Router();

router.get("/:id", controller.getById);
router.get("/municipality/:municipalityId", controller.listForMunicipality);
router.post("/:id/verify", requireAdmin, controller.verify);

module.exports = router;
