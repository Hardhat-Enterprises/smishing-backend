// src/routes/policy.routes.js

import express from "express";
const router = express.Router();

// Route: GET /api/policy/privacy
router.get("/privacy", (req, res) => {
    res.json({ message: "This is the privacy policy." });
});

export default router;
