import { analyzeMessage } from "../services/finalAnalysis.service.js";
import Analysis from "../models/analysis.model.js";

export const analyze = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const result = await analyzeMessage(message);

        const savedAnalysis = await Analysis.create(result);

        res.status(200).json(savedAnalysis);
    } catch (error) {
        console.error("Analysis error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
