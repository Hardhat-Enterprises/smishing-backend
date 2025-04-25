import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";

import authRoute from "./routes/auth.route.js";
import consentRoute from "./routes/consent.js";
import policyRoute from "./routes/policy.route.js"; // <-- add this

const app = express(); // <-- This must come BEFORE all app.use

app.use(express.json());

connectDB();

app.use("/api/auth", authRoute);
app.use("/api/consent", consentRoute);
app.use("/api/policy", policyRoute); // <-- add this after app is initialized

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
