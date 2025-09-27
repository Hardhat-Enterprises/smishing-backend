import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import newsRoute from "./routes/news.route.js";
import newsScheduler from "./utils/scheduler.util.js";

const app = express();

// Configure CORS for Android access
app.use(
    cors({
        origin: ["http://localhost:*", "http://10.0.2.2:*", "http://192.168.*.*:*"], // Android emulator and local network
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount routes
app.use("/api/auth", authRoute);
app.use("/api/news", newsRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Smishing Detection API is running",
        timestamp: new Date(),
        services: {
            database: "connected",
            newsScheduler: newsScheduler.getStatus(),
        },
    });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all interfaces for Android emulator access

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`📱 Android emulator can access via: http://10.0.2.2:${PORT}/api/news`);

    // Start news scheduler if API keys are configured
    if (process.env.NEWS_API_KEY || process.env.GUARDIAN_API_KEY) {
        newsScheduler.start(6); // Fetch every 6 hours
    } else {
        console.log("⚠️  No news API keys configured. News fetching disabled.");
    }
});

export default app;
