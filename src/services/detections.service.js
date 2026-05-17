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
        phoneNumber: phoneNumber || null,
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
// New function to retrieve detections with filtering and pagination
export const getDetections = async (filters = {}, page = 1, limit = 10) => {
    const query = {};

    if (filters.status) query.result = filters.status;
    if (filters.phoneNumber) query.phoneNumber = filters.phoneNumber;

    const skip = (page - 1) * limit;
    const total = await Detections.countDocuments(query);
    const detections = await Detections.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit);

    return {
        detections,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
    };
};
