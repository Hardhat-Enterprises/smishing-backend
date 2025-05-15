import express from "express";
import { guestScan } from "../controllers/guest.controller.js";

const router = express.Router();

// Route for guest scanning
router.post("/guest-scan", guestScan);

export default router;
