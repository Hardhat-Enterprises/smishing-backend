import { analyzeMessage } from "../services/finalAnalysis.service.js";

export const analyze = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Message is required",
            });
        }

        const result = await analyzeMessage(message);

        console.log(result);

        return res.status(200).json(result);
    } catch (error) {
        console.error("Analysis error:", error);

        return res.status(500).json({
            error: "Internal server error",
        });
    }
};
