// -------------------------------
//  Load environment variables
// -------------------------------
import "dotenv/config";

// -------------------------------
//  Core server
// -------------------------------
import express from "express";

// -------------------------------
//  DB (Mongoose -> MongoDB Atlas)
// -------------------------------
import connectDB from "./configs/db.config.js";

// -------------------------------
//  Feature routes
// -------------------------------
import authRoute from "./routes/auth.route.js";
import scanRoutes from "./routes/scan.route.js";
import spamRoute from "./routes/spam.route.js";
import contactRoute from "./routes/contact.route.js";
import healthRoute from "./routes/health.route.js";
import userRoute from "./routes/userUpdate.route.js";
import detectionsRoute from "./routes/detections.route.js";
import whoisRoutes from "./routes/whois.route.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import faqRoute from "./routes/faq.route.js";   // ✅ Added FAQ

// -------------------------------
//  Middlewares 
// -------------------------------
import securityMiddleware from "./middlewares/security.middleware.js";
import { apiLimiter, authLimiter } from "./middlewares/RateLimiter.middleware.js";
import cors from "cors";

// -------------------------------
//  Models (used by /api/reports)
// -------------------------------
import Report from "./models/report.model.js";

// -------------------------------
//  App
// -------------------------------
const app = express();
app.use(express.json());
app.use(cors());
// So req.ip is real when behind nginx/Cloudflare/Render/etc.
app.set("trust proxy", true);

/* ====================================================================== */
/* 1) GLOBAL MIDDLEWARES                                                  */
/* ====================================================================== */
app.use(securityMiddleware);

// Mount the feedback routes under the '/api' path
app.use("/api", feedbackRoutes);

// Apply general rate limiter
app.use(apiLimiter);
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

/* ====================================================================== */
/* 2) ROUTE MOUNTING                                                      */
/* ====================================================================== */
app.use("/api/whois", whoisRoutes);        // ✅ Made consistent
app.use("/api/auth", authLimiter, authRoute);
app.use("/api/contact", contactRoute);
app.use("/api/scan", scanRoutes);
app.use("/api/spam", spamRoute);
app.use("/api/detections", detectionsRoute);
app.use("/api/health", healthRoute);       // ✅ Made consistent
app.use("/api/userUpdate", userRoute);
app.use("/api/faq", faqRoute);             // ✅ Added FAQ

/* ====================================================================== */
/* 3) SERVER BOOT                                                         */
/* ====================================================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
