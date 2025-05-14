import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectDB(delay = 3000) {
    while (true) {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("Connected to MongoDB");
            break; // Exit loop once connected
        } catch (error) {
            console.error("MongoDB connection failed. Retrying in 3 seconds...");
            console.error("Error:", error.message);
            await new Promise(res => setTimeout(res, delay)); // Wait then retry
        }
    }
}

// Twilio Configuration
export const twilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    serviceId: process.env.TWILIO_SERVICE_ID,
};

console.log("Twilio Config:", twilioConfig); // For debugging

export default connectDB;
