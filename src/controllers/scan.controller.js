import axios from "axios";
import { analyzeMessageUrls, extractBrandMentions } from "../services/detections.service.js";
import { trackScanResult } from "../middlewares/fingerprint.middleware.js";

/**
 * POST /api/scan
 * Predicts whether an SMS message is a smishing attempt
 * @param {Object} req - Request object with message in body
 * @param {Object} res - Response object
 */
export const scan = async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(422).json({
            detail: "Message is required",
        });
    }

    try {
        const response = await axios.post("http://localhost:5050/api/predict", { message });
        const { prediction, confidence } = response.data;
        
        // Enhance with lexical analysis
        const brandMentions = extractBrandMentions(message);
        const urlAnalysis = await analyzeMessageUrls(message, brandMentions);
        
        // Track the scan result for this fingerprint
        trackScanResult(req.fingerprint, prediction);

        res.json({
            prediction,
            confidence,
            urlAnalysis,
            brandMentions: brandMentions.map(b => b.name),
            fingerprint: req.fingerprint // Included for verification
        });
    } catch (error) {
        console.error("Prediction API error:", error.message);
        
        // Fallback or just report error
        const brandMentions = extractBrandMentions(message);
        const urlAnalysis = await analyzeMessageUrls(message, brandMentions);
        const prediction = urlAnalysis.maxRisk > 60 ? "smishing" : "ham";
        
        // Track the fallback result too
        trackScanResult(req.fingerprint, prediction);
        
        res.status(200).json({
            detail: "Failed to get prediction from ML microservice, used lexical analysis fallback",
            prediction: prediction,
            confidence: urlAnalysis.maxRisk / 100,
            urlAnalysis,
            fingerprint: req.fingerprint
        });
    }
};
