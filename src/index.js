
require('dotenv').config();
const express = require('express');
const connectDB = require('./configs/db.config.js');
const authRoute = require('./routes/auth.route.js');
const guardianRoute = require('./routes/guardian.route');
const manualChecker = require('./routes/manualChecker');
=======
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

const notifyGuardianRoute = require('./routes/notifyGuardian') // Import route
app.use('/api', notifyGuardianRoute) // Register route
const manualChecker = require('./routes/manualChecker')
app.use('/api', manualChecker) // add after express setup

// Connect to MongoDB
connectDB();

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
