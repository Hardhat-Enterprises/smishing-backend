import express from "express";
import { sendCustomEmail, sendMultiEmail } from "../controllers/email.controller.js";

const router = express.Router();

// Custom email (single recipient)
router.post("/notifications/custom", sendCustomEmail);

// Multi email (multiple recipients)
router.post("/notifications/multi", sendMultiEmail);

export default router;
