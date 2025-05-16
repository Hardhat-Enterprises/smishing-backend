// src/routes/risk.route.js
import express from "express";
import { scanRisk } from "../controllers/risk.controller.js";
import Risk from "../models/risk.model.js"; // ✅ Add this line

const router = express.Router();

// Analyze risk and store in DB
router.post("/scan", scanRisk);

// Get historical risk analysis
router.get("/history/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const history = await Risk.find({ userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error("Error fetching history:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
});

export default router;
