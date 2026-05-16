import axios from "axios";
import { saveDetection } from "../services/detections.service.js";
/**
 * POST /api/scan
 * Predicts whether an SMS message is a smishing attempt
 * @param {Object} req - Request object with message in body
 * @param {Object} res - Response object
 */
export const scan = async (req, res) => {
    const { message, phoneNumber } = req.body;

    if (!message) {
        return res.status(422).json({
            detail: "Message is required",
        });
    }

    try {
        const response = await axios.post(`${process.env.ML_SERVICE_URL}/api/predict`, { message });
        const { prediction, confidence } = response.data;

        // Save detection result to MongoDB
        await saveDetection({
            messageContent: message,
            phoneNumber: phoneNumber || "unknown",
            result: prediction,
            confidence: confidence,
            advice: "",
            source: "scan",
        });

        res.json({
            prediction,
            confidence,
        });
    } catch (error) {
        console.error("Prediction API error:", error.message);
        res.status(500).json({
            detail: "Failed to get prediction from ML microservice",
        });
    }
};
