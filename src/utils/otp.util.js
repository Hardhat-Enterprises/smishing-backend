import bcrypt from "bcrypt";
import Otp from "../models/otp.model.js";
import mongoose from "mongoose";

const OTP_EXPIRY_MINUTES = process.env.OTP_EXPIRY_MINUTES || 10;
const OTP_LENGTH = 6;
const OTP_LIMIT = process.env.OTP_LIMIT || 5;
const LOCKOUT_TIME = process.env.LOCKOUT_TIME || 10 * 60 * 1000;

const generateRandomOtp = () => {
    return Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * (10 ** OTP_LENGTH - 1)).toString();
};

export const generateOtp = async (userId, purpose) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const recentOtpRequests = await Otp.countDocuments({
            userId,
            purpose,
            createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
            isUsed: false,
        }).session(session);

        if (recentOtpRequests >= OTP_LIMIT) {
            throw new Error(`You have exceeded the OTP request limit of ${OTP_LIMIT} per 10 minutes.`);
        }

        const plainOtp = generateRandomOtp();
        const otpHash = await bcrypt.hash(plainOtp, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const otpRecord = new Otp({
            userId,
            otpHash,
            purpose,
            expiresAt,
        });

        await otpRecord.save({ session });
        await session.commitTransaction();
        session.endSession();

        return plainOtp;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error while generating OTP:", error);
        throw new Error(error.message || "An error occurred while generating the OTP. Please try again.");
    }
};

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

        if (otpRecord.failedAttempts >= OTP_LIMIT) {
            const lockoutTimeRemaining = otpRecord.lockoutUntil ? otpRecord.lockoutUntil - new Date() : 0;
            if (lockoutTimeRemaining > 0) {
                return {
                    success: false,
                    lockoutUntil: otpRecord.lockoutUntil,
                    attemptsLeft: 0,
                };
            }
        }

        const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);
        if (!isMatch) {
            otpRecord.failedAttempts += 1;

            if (otpRecord.failedAttempts >= OTP_LIMIT) {
                otpRecord.lockoutUntil = new Date(Date.now() + LOCKOUT_TIME);
                await otpRecord.save();
                return {
                    success: false,
                    lockoutUntil: otpRecord.lockoutUntil,
                    attemptsLeft: 0,
                };
            }

            await otpRecord.save();
            return {
                success: false,
                lockoutUntil: null,
                attemptsLeft: OTP_LIMIT - otpRecord.failedAttempts,
            };
        }

        otpRecord.isUsed = true;
        otpRecord.failedAttempts = 0;
        otpRecord.lockoutUntil = null;
        await otpRecord.save();

        return {
            success: true,
            lockoutUntil: null,
            attemptsLeft: OTP_LIMIT,
        };
    } catch (error) {
        console.error("Error while verifying OTP:", error);
        throw new Error(error.message || "An error occurred while verifying the OTP.");
    }
};
