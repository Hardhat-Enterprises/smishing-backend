import express from "express";
import { exportCSV, getDetectionsHandler } from "../controllers/detections.controller.js";

const router = express.Router();

router.get("/export", exportCSV);

// New route to fetch detections with filtering and pagination
router.get("/", getDetectionsHandler);

export default router;
