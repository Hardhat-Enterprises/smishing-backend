import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectDB() {
    try {
        const uri = process.env.MONGO_URI; // using ENV variable instead of hardcoding
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(" Connected to MongoDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit if database connection fails
    }
}

export default connectDB;
