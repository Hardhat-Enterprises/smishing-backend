import mongoose from "mongoose";

const blockedIpSchema = new mongoose.Schema(
    {
        ip: {
            type: String,
            required: true,
            unique: true,
        },
        reason: {
            type: String,
            default: "Suspicious login activity detected.",
        },
        blockedUntil: {
            type: Date,
            required: true,
        },
        failedAttempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
);

const BlockedIp = mongoose.model("BlockedIp", blockedIpSchema);

export default BlockedIp;
