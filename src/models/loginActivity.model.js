import mongoose from "mongoose";

const LoginActivitySchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, index: true, required: true },
    at: { type: Date, default: Date.now, index: true },
    ip: String,
    userAgent: String,
    success: { type: Boolean, required: true },
    factorsUsed: { type: [String], default: ["password"] },
    alerted: { type: Boolean, default: false },
});

export default mongoose.model("LoginActivity", LoginActivitySchema);
