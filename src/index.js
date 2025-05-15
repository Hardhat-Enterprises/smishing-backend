import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import blacklistRoutes from './routes/blacklist.route.js';
import reportLogRoutes from './routes/reportlog.route.js';
import userPreferenceRoutes from './routes/userpreference.route.js';

import reputationRoutes from './routes/reputation.route.js';








const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount auth routes at /api/auth
app.use("/api/auth", authRoute);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/reportlog', reportLogRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/userpreference', userPreferenceRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
