import bcrypt from "bcrypt";
import Otp from "../models/otp.model.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;
const OTP_LIMIT = 5;

const generateRandomOtp = () => {
    return Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * (10 ** OTP_LENGTH - 1)).toString();
};

export const generateOtp = async (userId, purpose) => {
    try {
        await Otp.deleteMany({ expiresAt: { $lt: new Date() } });
        const recentOtpRequests = await Otp.countDocuments({
            userId,
            purpose,
            createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
            isUsed: false,
        });

        if (recentOtpRequests >= OTP_LIMIT) {
            throw new Error(`You have exceeded the OTP request limit of ${OTP_LIMIT} per 10 minutes.`);
        }
        await Otp.deleteMany({ userId, purpose, isUsed: false });

        const plainOtp = generateRandomOtp();
        const saltRounds = 10;
        const otpHash = await bcrypt.hash(plainOtp, saltRounds);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        await Otp.create({
            userId,
            otpHash,
            purpose,
            expiresAt,
        });
        return plainOtp;
    } catch (error) {
        console.error("Error while generating OTP:", error);
        throw new Error("An error occurred while generating the OTP. Please try again.");
    }
};
