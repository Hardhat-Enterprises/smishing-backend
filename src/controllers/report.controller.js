import Report from "../models/report.model.js";

export const createReport = async (req, res) => {
    const { sender, message } = req.body;

    if (!sender || !message) {
        return res.status(400).json({
            success: false,
            message: "Sender and message are required.",
        });
    }

    try {
        const report = new Report({
            sender,
            message,
            user: req.user._id,
            date: new Date(),
        });

        await report.save();

        return res.status(201).json({
            success: true,
            message: "Report submitted successfully.",
            report,
        });
    } catch (error) {
        console.error("Error submitting report:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
