import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import { hashPassword, comparePassword, hashOtp, compareOtp, generateToken } from "../utils/token.util.js";
import { sendEmail } from "../services/email.service.js";

/**
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password } = req.body;

        if (!fullName || !phoneNumber || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields (fullName, phoneNumber, email, password) are required.",
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Unable to register. Please try again.",
            });
        }

        // Basic email validation regex
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(422).json({
                success: false,
                message: "Invalid email format.",
            });
        }

        const passwordHash = await hashPassword(password);
        const user = await User.create({
            fullName,
            phoneNumber,
            email,
            passwordHash,
            isEmailVerified: false,
        });

        // Generate OTP and hash
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await hashOtp(otpCode);
        const expiresAt = new Date(Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60000);

        await Otp.create({
            userId: user._id,
            otpHash,
            expiresAt,
        });

        await sendEmail(email, `Your verification OTP is: ${otpCode}. It will expire in 10 minutes.`);

        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your email.",
        });
    } catch (error) {
        console.error("Error in signup:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

/**
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP required.",
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const otpRecord = await Otp.findOne({
            userId: user._id,
            isUsed: false,
        });

        if (!otpRecord)
            return res.status(400).json({
                success: false,
                message: "Invalid or already used OTP.",
            });

        const isMatch = await compareOtp(otp, otpRecord.otpHash);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP expired.",
            });
        }

        otpRecord.isUsed = true;
        await otpRecord.save();

        user.isEmailVerified = true;
        await user.save();

        return res.json({
            success: true,
            message: "Email verified successfully.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        // Basic email validation regex
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(422).json({
                success: false,
                message: "Invalid email format.",
            });
        }

        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({
                success: false,
                message: "Invalid email.",
            });

        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch)
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
            });
        }

        const token = generateToken({ userId: user._id });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
