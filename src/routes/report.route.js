// src/routes/report.route.js
import { Router } from "express";
import {
    analyzeReport,
    getReports,
    getReportSummary,
    getReportById,
    reviewReport,
    exportReviewedReports,
} from "../controllers/report.controller.js";

const router = Router();

// existing route
router.post("/report/analyze", analyzeReport);

// new routes
router.get("/reports", getReports);
router.get("/reports/summary", getReportSummary);
router.get("/reports/export/reviewed", exportReviewedReports);
router.get("/reports/:id", getReportById);
router.patch("/reports/:id/review", reviewReport);

export default router;
