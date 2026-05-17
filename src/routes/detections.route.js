import express from "express";
import { exportCSV } from "../controllers/detections.controller.js";

const router = express.Router();

router.get("/export", exportCSV);

export default router;
