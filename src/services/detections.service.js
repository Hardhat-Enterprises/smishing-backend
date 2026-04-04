import Detections from "../models/detections.model.js";
import { Parser } from "json2csv";
import { extractUrls, analyzePath, getTLDRisk } from "../utils/entropy.js";

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

/**
 * Analyzes all URLs within a message and returns a consolidated risk report.
 * 
 * @param {string} message - The message text to analyze.
 * @returns {Object} - Risk analysis results.
 */
export const analyzeMessageUrls = (message) => {
    if (!message) return { urlsDetected: 0, maxRisk: 0, analysis: [] };
    
    const urls = extractUrls(message);
    const analysis = urls.map(url => {
        let hostname = "";
        try {
            hostname = new URL(url).hostname;
        } catch (e) {
            // Fallback for malformed URLs that might still be interesting
            hostname = url.split("/")[2] || "";
        }

        const pathInfo = analyzePath(url);
        const tldRisk = getTLDRisk(hostname);
        
        // Calculate risk score based on lexical features
        // Higher entropy means more randomness, which is common in DGA/malicious paths
        let riskScore = 0;
        riskScore += pathInfo.pathEntropy * 15; // Shannon entropy weight
        riskScore += pathInfo.depth * 5;        // Path depth weight
        if (pathInfo.hasSuspiciousExtension) riskScore += 40; // High risk for extensions like .php, .exe
        riskScore += tldRisk * 3;               // TLD risk weight (e.g., .top, .link)
        
        return {
            url,
            riskScore: Math.min(100, Math.round(riskScore)),
            ...pathInfo,
            tldRisk
        };
    });

    const maxRisk = analysis.length > 0 ? Math.max(...analysis.map(a => a.riskScore)) : 0;

    return {
        urlsDetected: urls.length,
        maxRisk,
        analysis
    };
};
