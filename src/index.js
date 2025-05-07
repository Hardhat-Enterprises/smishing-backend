import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import chatbotRoute from "./routes/chatbot.route.js";
import newsRoute from "./routes/news.route.js";

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount auth routes at /api/auth
app.use("/api/auth", authRoute);
app.use("/", chatbotRoute);
app.use("/api/news", newsRoute);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
