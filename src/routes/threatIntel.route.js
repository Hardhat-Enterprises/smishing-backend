import express from "express";
import { getCisaFeedExample } from "../controllers/threatIntel.controller.js";

const router = express.Router();

// GET /api/threat-intel/cisa
router.get("/cisa", getCisaFeedExample);

export default router;
