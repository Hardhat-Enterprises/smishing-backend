import bcrypt from "bcrypt";
import Otp from "../models/otp.model.js";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_TIME = 10 * 60 * 1000;

export const verifyOtp = async (userId, purpose, enteredOtp) => {
    try {
        const otpRecord = await Otp.findOne({
            userId,
            purpose,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            throw new Error("No valid OTP found or it has expired.");
        }
        if (otpRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
            const lockoutTimeRemaining = LOCKOUT_TIME - (new Date() - otpRecord.createdAt);
            if (lockoutTimeRemaining > 0) {
                throw new Error(
                    `Too many failed attempts. Please try again after ${Math.floor(lockoutTimeRemaining / 1000)} seconds.`,
                );
            }
        }
        const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);
        if (!isMatch) {
            otpRecord.failedAttempts += 1;
            await otpRecord.save();

            if (otpRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                throw new Error("Too many failed attempts. You are now locked out for 10 minutes.");
            }
            throw new Error("Invalid OTP.");
        }
        otpRecord.isUsed = true;
        otpRecord.failedAttempts = 0;
        await otpRecord.save();
        return true;
    } catch (error) {
        console.error("Error while verifying OTP:", error);
        if (error.message === "No valid OTP found or it has expired.") {
            throw new Error("The OTP is either invalid or has expired. Please request a new one.");
        } else if (error.message === "Invalid OTP.") {
            throw new Error("The OTP you entered is incorrect. Please try again.");
        } else {
            throw new Error("An error occurred while verifying the OTP. Please try again.");
        }
    }
};
