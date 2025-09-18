import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.route.js";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import detectionsRoute from "./routes/detections.route.js";
import scanRoutes from "./routes/scan.route.js";
import spamRoute from "./routes/spam.route.js";
import contactRoute from "./routes/contact.route.js";
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import cors from "cors";
import whoisRoutes from "./routes/whois.route.js";

import userRoute from "./routes/userUpdate.route.js";

// calling body-parser to handle the Request Object from POST requests
import bodyParser from "body-parser";

const app = express();
app.use(express.json());
app.use(cors());
// So req.ip is real when behind nginx/Cloudflare/Render/etc.
app.set("trust proxy", true);

// Apply security headers middleware
app.use(securityMiddleware);

// Mount the feedback routes under the '/api' path
app.use(express.json());
app.use("/api", feedbackRoutes);

// Apply general rate limiter
app.use(apiLimiter);

// Parse incoming JSON requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

app.use("/whois", whoisRoutes);
// Mount auth routes at /api/auth
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/auth", authRoutes);

// Mount contact routes at /api/contact
app.use("/api/contact", contactRoute);

// Mount scan routes at /api/scan
app.use("/api", scanRoutes);

// Mount spam routes at /api/spam
app.use("/api/spam", spamRoute);


app.use("/api/detections", detectionsRoute);



// Mount update routes at /api/user
app.use("/api/userUpdate", userRoute);

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
