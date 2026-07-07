const express = require("express");
const { checkLinkSafety } = require("../controllers/safeLinkChecker.controller");

const router = express.Router();

router.post("/check-link", checkLinkSafety); // Endpoint: /api/check-link

module.exports = router;
