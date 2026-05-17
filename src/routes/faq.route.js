import express from "express";
import Faq from "../models/faq.model.js";

const router = express.Router();

// Hardcoded default FAQs (always available)
const defaultFaqs = [
    {
        question: "What is smishing?",
        answer: "Smishing is a type of phishing attack using SMS messages to trick users into revealing information.",
    },
    {
        question: "How can I report a smishing attempt?",
        answer: "You can use the report button in the app or forward the message to your mobile provider.",
    },
    {
        question: "How do I protect myself from smishing?",
        answer: "Never click suspicious links, and don’t share personal details over SMS.",
    },
    {
        question: "What happens if I click a suspicious link?",
        answer: "Clicking suspicious links can expose your personal information or install malware on your device.",
    },
    {
        question: "Can I customize notifications for smishing alerts?",
        answer: "Yes, you can manage alert preferences in the Settings page, including vibration, sound, and priority level.",
    },
];

// GET /api/faq - Fetch all FAQ entries
router.get("/", async (req, res) => {
    try {
        // Get all DB FAQs
        const dbFaqs = await Faq.find({});
        // Combine defaults + DB entries
        const combinedFaqs = [...defaultFaqs, ...dbFaqs];
        res.json(combinedFaqs);
    } catch (error) {
        console.error("Error fetching FAQs:", error.message);
        res.status(500).json({ message: "Failed to fetch FAQs" });
    }
});

export default router;
