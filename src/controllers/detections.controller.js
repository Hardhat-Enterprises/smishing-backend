import { getFilteredDetections, getDetections } from "../services/detections.service.js";
import Detections from "../models/detections.model.js"; // Added to support summary endpoint

export const exportCSV = async (req, res) => {
    try {
        const { status, type, startDate, endDate, phoneNumber } = req.query;

        const detectionsCSV = await getFilteredDetections({
            status,
            type,
            startDate,
            endDate,
            phoneNumber,
        });

        res.header("Content-Type", "text/csv");
        res.attachment("detections.csv");

        return res.send(detectionsCSV);
    } catch (error) {
        console.error("Error in exporting detections:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

// New handler to fetch detections with filtering and pagination
export const getDetectionsHandler = async (req, res) => {
    try {
        const { status, phoneNumber, page, limit } = req.query;
        const result = await getDetections({ status, phoneNumber }, parseInt(page) || 1, parseInt(limit) || 10);

        // Empty result check and improved error responses
        if (!result || result.totalCount === 0) {
            return res.status(200).json({
                success: true,
                message: "No detections found.",
                ...result,
            });
        }

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Error fetching detections:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

//  New summary endpoint to return detection statistics
export const getDetectionsSummary = async (req, res) => {
    try {
        const totalScans = await Detections.countDocuments();
        const smishingCount = await Detections.countDocuments({ result: "smishing" });
        const spamCount = await Detections.countDocuments({ result: "spam" });
        const safeCount = await Detections.countDocuments({ result: "safe" });

        return res.status(200).json({
            success: true,
            totalScans,
            smishingCount,
            spamCount,
            safeCount,
        });
    } catch (error) {
        console.error("Error fetching detection summary:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
