import mongoose from "mongoose";
import dotenv from "dotenv";
import FAQ from "./src/models/faq.model.js";

// Load environment variables from .env
dotenv.config();

console.log("🚀 Running seedFaq.js...");

// MongoDB connection string from .env
const MONGO_URL = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log("✅ Connected to MongoDB");

        // Clear existing FAQs first (optional – uncomment if you want a clean reset each time)
        // await FAQ.deleteMany({});

        // Insert ONLY additional FAQs (not the hardcoded defaults in faq.route.js)
        await FAQ.insertMany([
            {
                question: "What should I do if I receive a smishing message?",
                answer: "Do not respond. Report it using the app's report feature or forward it to your carrier.",
            },
            {
                question: "Can smishing messages be blocked?",
                answer: "Many carriers provide spam-blocking services. Check with your provider for options.",
            },
            {
                question: "Is smishing the same as phishing?",
                answer: "Yes — smishing is just phishing delivered over SMS.",
            },
            {
                question: "What should I do if I clicked a smishing link?",
                answer: "Change your passwords immediately and watch for suspicious activity.",
            },
        ]);

        console.log("✅ Extra FAQs added successfully!");
        mongoose.disconnect();
    })
    .catch((err) => {
        console.error("❌ Error connecting to MongoDB:", err.message);
        process.exit(1);
    });
