import Detection from "../models/detection.model.js";

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Total scans by user
        const totalScans = await Detection.countDocuments({ userId });

        // Total smishing detections
        const smishingCount = await Detection.countDocuments({
            userId,
            label: "smishing",
        });

        // Latest scan timestamp
        const latestScan = await Detection.findOne({ userId }).sort({ createdAt: -1 }).select("createdAt");

        res.status(200).json({
            totalScans,
            smishingCount,
            lastScanAt: latestScan?.createdAt || null,
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: "Something went wrong." });
    }
};
