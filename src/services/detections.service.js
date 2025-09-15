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
