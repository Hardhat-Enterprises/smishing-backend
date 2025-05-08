
require('dotenv').config()
const express = require('express')
const connectDB = require('./configs/db.config.js')

// Import existing routes
const authRoute = require('./routes/auth.route.js')
const scanRoute = require('./routes/scan.route.js')

// Import the new report route
const reportRoute = require('./routes/report.route.js')
// Import the new User Settings route
const userSettingsRoute = require('./routes/userSettings.route.js')

import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";


const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();


// Basic health-check
app.get('/', (req, res) => {
    res.send('Smishing Detection Backend is up and running!')
})

// Existing routes
app.use('/api/auth', authRoute)
app.use('/scan', scanRoute)
app.use('/api/settings', userSettingsRoute)

// New route for manual smishing reporting
app.use('/api/report', reportRoute)
=======
// Mount auth routes at /api/auth
app.use("/api/auth", authRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
