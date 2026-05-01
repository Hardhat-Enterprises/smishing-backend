import express from "express";
import { getSecuritySummary } from "../controllers/adminSecurity.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/security-summary", authMiddleware, getSecuritySummary);

export default router;
