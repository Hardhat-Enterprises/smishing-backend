import express from "express";
import { scan } from "../controllers/scan.controller.js";

const router = express.Router();

// POST /scan
router.post("/scan", scan);

export default router;
