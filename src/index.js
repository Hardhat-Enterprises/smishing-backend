import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import policyRoute from "./routes/policy.routes.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import authenticate from "./middleware/authenticate.js";

const app = express();
app.use(express.json());

// Routes
app.use("/dashboard", authenticate, dashboardRoutes);
app.use("/api/auth", authRoute);
app.use("/api/policy", policyRoute);

// ✅ Only connect to DB and start server if not in test mode
if (process.env.NODE_ENV !== "test") {
    connectDB(); // only run DB connection when not testing

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}

export default app;
