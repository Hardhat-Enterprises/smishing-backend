import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import scanRoutes from "./routes/scan.route.js";
import spamRoute from "./routes/spam.route.js";
import contactRoute from "./routes/contact.route.js";
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter.middleware.js";

// calling body-parser to handle the Request Object from POST requests
import bodyParser from "body-parser";

const app = express();

// Apply security headers middleware
app.use(securityMiddleware);

// Apply general rate limiter
app.use(apiLimiter);

// Parse incoming JSON requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }))

// Connect to MongoDB
connectDB();
console.log("Twilio SID:", process.env.TWILIO_ACCOUNT_SID);
console.log("Twilio Auth Token:", process.env.TWILIO_AUTH_TOKEN);
console.log("Twilio Service ID:", process.env.TWILIO_SERVICE_ID);

// Mount auth routes at /api/auth
app.use("/api/auth", authLimiter, authRoute);

// Mount contact routes at /api/contact
app.use("/api/contact", contactRoute);

// Mount scan routes at /api/scan
app.use("/api", scanRoutes);

// Mount spam routes at /api/spam
app.use("/api/spam", spamRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
