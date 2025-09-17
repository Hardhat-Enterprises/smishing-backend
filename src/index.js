import "dotenv/config";
import express from "express";
import connectDB from "./configs/db.config.js";
import authRoute from "./routes/auth.route.js";
import faqRoute from "./routes/faq.route.js";

const app = express();
app.use(express.json());

// Connect to MongoDB
(await connectDB?.()) ?? connectDB(); // use await if your connectDB returns a promise

// Mount routes
app.use("/api/auth", authRoute);
app.use("/api/faq", faqRoute);
app.use("/api/faqs", faqRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
