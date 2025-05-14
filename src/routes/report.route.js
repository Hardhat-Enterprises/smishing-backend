import express from "express";
import { submitReport, getUserReports, exportReportsCSV, exportReportsPDF } from "../controllers/report.controller.js";

const router = express.Router();

router.post("/submit", submitReport);
router.get("/user", getUserReports);
router.get("/export/pdf", exportReportsPDF);
router.get("/export/csv", exportReportsCSV);

export default router;
