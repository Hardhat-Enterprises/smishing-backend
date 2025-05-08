import bcrypt from "bcrypt";
import Otp from "../models/otp.model.js";
import mongoose from "mongoose";

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
const OTP_LENGTH = parseInt(process.env.OTP_LENGTH, 10) || 6;
const OTP_LIMIT = parseInt(process.env.OTP_LIMIT, 10) || 5;
const OTP_LOCKOUT_TIME = parseInt(process.env.OTP_LOCKOUT_TIME, 10) || 10 * 60 * 1000;

/**
 * Generates a random numeric OTP of length OTP_LENGTH.
 */
const generateRandomOtp = () => {
    return Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * (10 ** OTP_LENGTH - 1)).toString();
};

/**
 * Creates and stores a new OTP for the given user and purpose,
 * enforcing rate limits and one-active-OTP semantics.
 *
 * @param {ObjectId} userId
 * @param {"signup"|"resetpassword"} purpose
 * @returns {Promise<string>} plaintext OTP
 */
export const generateOtp = async (userId, purpose) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Enforce rate limit
        const windowStart = new Date(Date.now() - OTP_EXPIRY_MINUTES * 60 * 1000);
        const recentCount = await Otp.countDocuments({
            userId,
            purpose,
            isUsed: false,
            createdAt: { $gt: windowStart },
        }).session(session);

        if (recentCount >= OTP_LIMIT) {
            throw new Error(`Exceeded ${OTP_LIMIT} OTP requests in last ${OTP_EXPIRY_MINUTES} minutes.`);
        }

        // Remove any existing unused OTPs for this user + purpose
        await Otp.deleteMany({ userId, purpose, isUsed: false }).session(session);

        // Generate & hash new OTP
        const plainOtp = generateRandomOtp();
        const otpHash = await bcrypt.hash(plainOtp, 10);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        const otpRecord = new Otp({ userId, otpHash, purpose, expiresAt });
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

/**
 * Verifies a user-entered OTP for the given user and purpose,
 * handling failed-attempts lockout and marking the OTP used on success.
 *
 * @param {ObjectId} userId
 * @param {"signup"|"resetpassword"} purpose
 * @param {string} enteredOtp
 * @returns {Promise<{success: boolean, attemptsLeft: number, lockoutUntil: Date|null, message: string}>}
 */
export const verifyOtp = async (userId, purpose, enteredOtp) => {
    try {
        const otpRecord = await Otp.findOne({
            userId,
            purpose,
            isUsed: false,
            expiresAt: { $gt: new Date() },
        })
            .sort({ createdAt: -1 })
            .exec();

        if (!otpRecord) {
            return { success: false, attemptsLeft: 0, lockoutUntil: null, message: "Expired or invalid OTP" };
        }

        if (otpRecord.lockoutUntil && otpRecord.lockoutUntil > new Date()) {
            return {
                success: false,
                attemptsLeft: 0,
                lockoutUntil: otpRecord.lockoutUntil,
                message: "Too many failed attempts. Please try again later.",
            };
        }

        const isMatch = await bcrypt.compare(enteredOtp, otpRecord.otpHash);
        if (!isMatch) {
            otpRecord.failedAttempts += 1;

            if (otpRecord.failedAttempts >= OTP_LIMIT) {
                otpRecord.lockoutUntil = new Date(Date.now() + OTP_LOCKOUT_TIME);
                await otpRecord.save();
                return {
                    success: false,
                    attemptsLeft: 0,
                    lockoutUntil: otpRecord.lockoutUntil,
                    message: "Too many failed attempts. Account locked temporarily.",
                };
            }

            await otpRecord.save();
            return {
                success: false,
                attemptsLeft: OTP_LIMIT - otpRecord.failedAttempts,
                lockoutUntil: null,
                message: "Invalid OTP. Please try again.",
            };
        }

        otpRecord.isUsed = true;
        otpRecord.failedAttempts = 0;
        otpRecord.lockoutUntil = null;
        await otpRecord.save();

        return {
            success: true,
            attemptsLeft: OTP_LIMIT,
            lockoutUntil: null,
            message: "OTP verified successfully.",
        };
    } catch (error) {
        console.error("Error while verifying OTP:", error);
        throw new Error(error.message || "An error occurred while verifying the OTP.");
    }
};
