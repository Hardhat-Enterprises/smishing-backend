import { getFilteredDetections, getDetections } from "../services/detections.service.js";

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
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching detections:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
