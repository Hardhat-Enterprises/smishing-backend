import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";

const app = express();
app.use(express.json());

// Security Middlewares
const helmet = require('helmet');
app.use(helmet()) 

// Connect to MongoDB
connectDB()

// Mount auth routes at /api/auth
app.use('/api/auth', authRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app
