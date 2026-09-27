const express = require("express");
const router = express.Router();
const { getOfficeByLocation } = require("../controllers/officeController");

// GET /api/offices/resolve?q=Jogeshwari, Mumbai
router.get("/resolve", getOfficeByLocation);

// POST /api/offices/resolve { "location": "Andheri West" }
router.post("/resolve", getOfficeByLocation);

module.exports = router;