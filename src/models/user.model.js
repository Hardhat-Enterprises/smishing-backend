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
        // Added field for user role
        role: {
            type: String,
            enum: ["guest", "user", "admin", "qa", "dev"],
            default: "user", // Defaut Role
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
