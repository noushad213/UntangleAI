const express = require("express");
const controller = require("../controllers/workflow.controller");

const router = express.Router();

router.post("/", controller.query);

module.exports = router;
