import { getFilteredDetections } from "../services/detections.service.js";

export const exportCSV = async (req, res) => {
    try {
        const { status, type, startDate, endDate } = req.query;

        const detections = await getFilteredDetections({
            status,
            type,
            startDate,
            endDate,
        });

        res.status(200).json({
            success: true,
            count: detections.length,
            data: detections,
        });
    } catch (error) {
        console.error("Error in exporting detections:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
