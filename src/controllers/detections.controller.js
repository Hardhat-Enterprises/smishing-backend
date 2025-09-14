import { getFilteredDetections } from "../services/detections.service.js";

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
