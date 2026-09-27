const express = require("express");
const controller = require("../controllers/municipality.controller");

const router = express.Router();

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:slug", controller.getBySlug);
router.post("/:slug/issues", controller.addIssue);

module.exports = router;
