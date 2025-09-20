// src/routes/report.route.js
import { Router } from "express";
import { analyzeReport } from "../controllers/report.controller.js";

const router = Router();
router.post("/report/analyze", analyzeReport);

export default router;
