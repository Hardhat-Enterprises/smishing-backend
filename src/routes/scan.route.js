import express from "express";
import { scan } from "../controllers/scan.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate, scanSchema } from "../utils/validation/auth.validation.js";

const router = express.Router();

// POST /api/scan
router.post("/scan", authMiddleware, validate(scanSchema), scan);

export default router;
