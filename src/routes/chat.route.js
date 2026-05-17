import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const url = `${process.env.FLASK_API_URL}/chat/api/generate`;
        console.log("Proxying request to:", url);

        const response = await axios.post(url, { prompt: message });

        return res.json(response.data);
    } catch (err) {
        console.error("chat error:", err.message);
        if (err.response) {
            console.error("Flask responded with:", err.response.status, err.response.data);
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
