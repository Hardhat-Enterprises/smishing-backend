import axios from "axios";

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
