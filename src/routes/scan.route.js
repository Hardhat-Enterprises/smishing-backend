import express from "express";
import { scan } from "../controllers/scan.controller.js";
import { fingerprintMiddleware } from "../middlewares/fingerprint.middleware.js";

const router = express.Router();

// POST /scan
// Apply fingerprinting middleware for anti-bot defense
router.post("/scan", fingerprintMiddleware, scan);

export default router;
