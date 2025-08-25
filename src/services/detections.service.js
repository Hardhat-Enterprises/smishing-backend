import Detections from "../models/detections.model.js";

export const getFilteredDetections = async (filters) => {
    console.log(filters);
    try {
        const query = {};

        if (filters.status) query.status = filters.status;
        if (filters.type) query.type = filters.type;

        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
        }

        const detections = await Detections.find(query).sort({ timestamp: -1 });
        return detections;
    } catch (error) {
        throw new Error(error.message);
    }
};
