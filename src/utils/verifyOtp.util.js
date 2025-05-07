import bcrypt from "bcrypt";
import Otp from "../models/otp.model.js";

const MAX_FAILED_ATTEMPTS = process.env.OTP_LIMIT || 5;
const LOCKOUT_TIME = process.env.LOCKOUT_TIME || 10 * 60 * 1000;

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
            const lockoutTimeRemaining = otpRecord.lockoutUntil ? otpRecord.lockoutUntil - new Date() : 0;
            if (lockoutTimeRemaining > 0) {
                return {
                    success: false,
                    lockoutUntil: otpRecord.lockoutUntil,
                    attemptsLeft: 0,
                    message: "Account locked. Try again later.",
                };
            }
        }

        const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);
        if (!isMatch) {
            otpRecord.failedAttempts += 1;

            if (otpRecord.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                otpRecord.lockoutUntil = new Date(Date.now() + LOCKOUT_TIME);
                await otpRecord.save();
                return {
                    success: false,
                    lockoutUntil: otpRecord.lockoutUntil,
                    attemptsLeft: 0,
                    message: "Too many failed attempts. Account locked.",
                };
            }

            await otpRecord.save();
            return {
                success: false,
                lockoutUntil: null,
                attemptsLeft: MAX_FAILED_ATTEMPTS - otpRecord.failedAttempts,
                message: "Incorrect OTP. Try again.",
            };
        }

        otpRecord.isUsed = true;
        otpRecord.failedAttempts = 0;
        otpRecord.lockoutUntil = null;
        await otpRecord.save();

        return {
            success: true,
            lockoutUntil: null,
            attemptsLeft: MAX_FAILED_ATTEMPTS,
            message: "OTP verified successfully.",
        };
    } catch (error) {
        console.error("Error while verifying OTP:", error);
        throw new Error(error.message || "An error occurred while verifying the OTP.");
    }
};
