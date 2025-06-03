// import Detection from "../models/detection.model.js";

// export const getDashboardStats = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         // Total scans by user
//         const totalScans = await Detection.countDocuments({ userId });

//         // Total smishing detections
//         const smishingCount = await Detection.countDocuments({
//             userId,
//             label: "smishing",
//         });

//         // Latest scan timestamp
//         const latestScan = await Detection.findOne({ userId }).sort({ createdAt: -1 }).select("createdAt");

//         res.status(200).json({
//             totalScans,
//             smishingCount,
//             lastScanAt: latestScan?.createdAt || null,
//         });
//     } catch (error) {
//         console.error("Dashboard error:", error);
//         res.status(500).json({ error: "Something went wrong." });
//     }
// };
import Detection from "../models/detection.model.js";

export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregate stats using MongoDB aggregation for efficiency
        const [stats] = await Detection.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalScans: { $sum: 1 },
                    smishingCount: {
                        $sum: {
                            $cond: [{ $eq: ["$label", "smishing"] }, 1, 0],
                        },
                    },
                    lastScanAt: { $max: "$createdAt" },
                },
            },
        ]);

        res.status(200).json({
            totalScans: stats?.totalScans || 0,
            smishingCount: stats?.smishingCount || 0,
            lastScanAt: stats?.lastScanAt || null,
        });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.status(500).json({ error: "Something went wrong." });
    }
};
