import express from "express";
import { exportCSV, getDetectionsHandler, getDetectionsSummary } from "../controllers/detections.controller.js";
import { validateDetectionQuery } from "../middlewares/validators/detection.validator.js";

const router = express.Router();

router.get("/export", exportCSV);

// New route to fetch detections with filtering and pagination
router.get("/", validateDetectionQuery, getDetectionsHandler);

// New summary route
router.get("/summary", getDetectionsSummary);

export default router;
