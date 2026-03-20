import express from "express";
import spamController from "../controllers/spam.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validate, spamSchema } from "../utils/validation/auth.validation.js";

const router = express.Router();

// POST /api/spam/textChecker
router.post("/textChecker", authMiddleware, validate(spamSchema), spamController.checkSpamMessage);

export default router;
