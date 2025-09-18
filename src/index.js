import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import detectionsRoute from "./routes/detections.route.js";
import scanRoutes from "./routes/scan.route.js";
import spamRoute from "./routes/spam.route.js";
import contactRoute from "./routes/contact.route.js";
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import whoisRoutes from "./routes/whois.route.js";
import faqRoute from "./routes/faq.route.js";

// calling body-parser to handle the Request Object from POST requests
import bodyParser from "body-parser";

const app = express();

// Apply security headers middleware
app.use(securityMiddleware);

// Apply general rate limiter
app.use(apiLimiter);

// Parse incoming JSON requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
(await connectDB?.()) ?? connectDB(); // use await if your connectDB returns a promise

// Mount routes
app.use("/whois", whoisRoutes);
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/contact", contactRoute);
app.use("/api/scan", scanRoutes);
app.use("/api/spam", spamRoute);
app.use("/api/detections", detectionsRoute);

// FAQ routes
app.use("/api/faq", faqRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
