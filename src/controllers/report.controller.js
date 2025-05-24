import Report from "../models/report.model.js";
import { generatePDF, generateCSV, cleanupExportedFile } from "../services/export.service.js";

export const submitReport = async (req, res) => {
    try {
        const { type, content, sourceId, sourceType, additionalInfo } = req.body;

        if (!type || !content) {
            return res.status(400).json({
                success: false,
                message: "Type and content are required fields.",
            });
        }

        const report = await Report.create({
            userId: "64f1c2e5e15b4f6d8d0e2a3c", // Replace with req.user.id when authentication is implemented
            type,
            content,
            sourceId,
            sourceType,
            additionalInfo: additionalInfo || {},
        });

        return res.status(201).json({
            success: true,
            message: "Report submitted successfully.",
            report: {
                id: report._id,
                type: report.type,
                status: report.status,
                createdAt: report.createdAt,
            },
        });
    } catch (error) {
        console.error("Error submitting report:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const getUserReports = async (req, res) => {
    try {
        const userId = req.user?.id || req.query.userId;
        const reports = await Report.find({ userId: userId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: reports,
        });
    } catch (error) {
        console.error("Error fetching reports:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const exportReportsPDF = async (req, res) => {
    try {
        const { ids, all, status } = req.query;
        const userId = req.user?.id || req.query.userId;
        const query = { userId: userId };

        if (ids) {
            const reportIds = ids.split(",");
            query._id = { $in: reportIds };
        }

        if (status) {
            query.status = status;
        }

        if (!all && !ids) {
            return res.status(400).json({
                success: false,
                message: "Please provide report IDs or set 'all=true' to export all reports.",
            });
        }

        const reports = await Report.find(query).sort({ createdAt: -1 });

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No reports found matching your criteria.",
            });
        }

        const { filePath, fileName } = await generatePDF(reports);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

        res.download(filePath, fileName, (err) => {
            // cleanupExportedFile(filePath);

            if (err) {
                console.error("Error sending PDF:", err);
            }
        });
    } catch (error) {
        console.error("Error exporting reports as PDF:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

export const exportReportsCSV = async (req, res) => {
    try {
        const { ids, all, status } = req.query;

        const userId = req.user?.id || req.query.userId;
        const query = { userId: userId };

        if (ids) {
            const reportIds = ids.split(",");
            query._id = { $in: reportIds };
        }

        // If status filter is provided
        if (status) {
            query.status = status;
        }

        // If all parameter is not true and no IDs provided, return error
        if (!all && !ids) {
            return res.status(400).json({
                success: false,
                message: "Please provide report IDs or set 'all=true' to export all reports.",
            });
        }

        const reports = await Report.find(query).sort({ createdAt: -1 });

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No reports found matching your criteria.",
            });
        }

        const { filePath, fileName } = await generateCSV(reports);

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

        res.download(filePath, fileName, (err) => {
            // cleanupExportedFile(filePath);

            if (err) {
                console.error("Error sending CSV:", err);
            }
        });
    } catch (error) {
        console.error("Error exporting reports as CSV:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
