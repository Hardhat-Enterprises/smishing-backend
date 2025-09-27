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
            index: { expires: "0s" },
        },
        isUsed: {
            type: Boolean,
            default: false,
        },
        failedAttempts: {
            type: Number,
            default: 0,
        },
        lockoutUntil: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

otpSchema.index({ userId: 1, purpose: 1, isUsed: 1, expiresAt: 1 });

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
