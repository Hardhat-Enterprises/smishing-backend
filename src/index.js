import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import phishingRoute from "./routes/phishing.route.js";
import notificationRoute from "./routes/notification.route.js";
import userRoute from "./routes/user.route.js";

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount auth routes at /api/auth
app.use("/api/auth", authRoute);
app.use("/api/phishing-report", phishingRoute);
app.use("/api/notifications", notificationRoute);
app.use("/api/user", userRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
