import Feedback from "../models/Feedback.js";

export const submitFeedback = async (req, res) => {
    try {
        console.log("Request body received:", req.body); // 👈 log input

        const { user, message, rating } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const feedback = new Feedback({ user, message, rating });
        await feedback.save();

        res.status(201).json({ message: "Feedback submitted successfully" });
    } catch (error) {
        console.error("Feedback submit error:", error); // 👈 log the actual error
        res.status(500).json({ error: "Failed to submit feedback" });
    }
};
