import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        otpHash: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ["signup", "resetpassword"],
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        failedAttempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true },
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
