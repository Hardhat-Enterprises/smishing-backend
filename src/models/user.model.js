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

        tokenVersion: {
            type: Number,
            default: 0,
            select: true,
        },
        passwordUpdatedAt: {
            type: Date,
        },
        //  Security state used by login activity/alerts/lockout
        security: {
            failedLogins: { type: Number, default: 0 },
            lockUntil: { type: Date, default: null },
            loginAlerts: { type: Boolean, default: true },
            lastLoginAt: { type: Date, default: null },
            lastLoginIP: { type: String, default: "" },
            lastLoginUA: { type: String, default: "" },
            tokenVersion: { type: Number, default: 0, select: true },
            passwordUpdatedAt: { type: Date },
        },

        failedUpdateAttempts: {
            type: Number,
            default: 0,
        },
        lastFailedUpdateAttempt: {
            type: Date,
            default: new Date(0),
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        loginAttempts: {
            count: { type: Number, default: 0 },
            lockUntil: { type: Date, default: null },
        },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
