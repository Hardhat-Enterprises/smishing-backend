import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

// Assumes you're using authenticate middleware globally or in index.js
router.get("/", getDashboardStats);

export default router;
