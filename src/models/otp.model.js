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
    },
    { timestamps: true },
);

const Otp = mongoose.model("Otp", otpSchema);
export default Otp;
