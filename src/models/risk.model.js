// src/models/risk.model.js
import mongoose from "mongoose";

const RiskSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    riskScore: {
        type: Number,
        required: true,
    },
    riskFactors: {
        type: [String],  // List of strings describing risky factors
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("Risk", RiskSchema);
