import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        guardianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        fcmToken: {
            type: String,
            required: false,
        },
    },
    { timestamps: true },
);

export default mongoose.model("User", userSchema);
