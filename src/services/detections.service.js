import Detections from "../models/detections.model.js";
import { Parser } from "json2csv";

export const getFilteredDetections = async (filters) => {
    const query = {};

    if (filters.status && filters.status !== "all") query.status = filters.status;
    if (filters.type) query.type = filters.type;

    if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    if (filters.phoneNumber) {
        let phone = filters.phoneNumber.trim();
        if (!phone.startsWith("+")) {
            phone = "+" + phone;
        }
        query.phoneNumber = phone;
    }

    const detections = await Detections.find(query).sort({ timestamp: -1 });

    const fields = ["timestamp", "status", "type", "phoneNumber"];
    const opts = { fields };

    const parser = new Parser(opts);
    const csv = parser.parse(detections);

    return csv;
};
// New function added to save ML scan results to MongoDB
export const saveDetection = async ({ messageContent, phoneNumber, result, confidence, advice, source }) => {
    const detection = await Detections.create({
        timestamp: new Date(),
        phoneNumber: phoneNumber || "unknown",
        status: result,
        type: source || "scan",
        messageContent,
        result,
        confidence,
        advice,
        source: source || "scan",
    });

    return detection;
};
