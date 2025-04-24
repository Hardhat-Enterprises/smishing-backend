import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import reportRoute from "./routes/report.route.js";

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

app.use("/api/auth", authRoute);
app.use("/api", reportRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
