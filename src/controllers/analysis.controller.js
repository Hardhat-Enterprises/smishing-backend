import { analyzeMessage } from "../services/finalAnalysis.service.js";
import Analysis from "../models/analysis.model.js";

export const analyze = async (req, res) => {
    try {
        const { message } = req.body;

        // Validate input
        if (!message) {
            return res.status(400).json({
                error: "Message is required",
            });
        }

        // Analyze message
        const result = await analyzeMessage(message);

        // Save analysis to MongoDB
        const analysis = await Analysis.create({
            message: result.message,
            score: result.score,
            riskLevel: result.riskLevel,
            scamTypes: result.scamTypes,
            matchedKeywords: result.matchedKeywords,
            reasons: result.reasons,
        });

        // Return response
        return res.status(200).json(analysis);
    } catch (error) {
        console.error("Analysis error:", error);

        return res.status(500).json({
            error: "Internal server error",
        });
    }
};
