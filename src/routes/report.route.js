import express from "express";
import { createReport } from "../controllers/report.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/report", authenticate, createReport);

export default router;
