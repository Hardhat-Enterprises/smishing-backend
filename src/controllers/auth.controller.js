import User from "../models/user.model.js";
import { generateOtp, verifyOtp } from "../utils/otp.util.js";
import { hashPassword, comparePassword, generateToken } from "../utils/token.util.js";
import { sendEmail } from "../services/email.service.js";

/**
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Unable to register. Please try again.",
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

        try {
            const otpCode = await generateOtp(user._id, "signup");
            await sendEmail(email, `Your verification OTP is: ${otpCode}. It will expire in 10 minutes.`);
        } catch (otpError) {
            return res.status(400).json({
                success: false,
                message: otpError.message,
            });
        }

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
 * POST /api/auth/verify-email
 */
export const verifyemail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const result = await verifyOtp(user._id, "signup", otp);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                attemptsLeft: result.attemptsLeft,
                lockoutUntil: result.lockoutUntil,
                message: result.message || "Invalid OTP.",
            });
        }

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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email.",
            });
        }

        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }

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
        console.error("login error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotpassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        try {
            const otpCode = await generateOtp(user._id, "resetpassword");
            await sendEmail(email, `Your OTP to reset your password is: ${otpCode}. It will expire in 10 minutes.`);
        } catch (otpError) {
            return res.status(400).json({
                success: false,
                message: otpError.message,
            });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent to email for password reset",
        });
    } catch (error) {
        console.error("forgotpassword errpr", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

/**
 * POST /api/auth/reset-password
 */
export const resetpassword = async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const result = await verifyOtp(user._id, "resetpassword", otp);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                attemptsLeft: result.attemptsLeft,
                lockoutUntil: result.lockoutUntil,
                message: result.message || "Invalid or expired OTP.",
            });
        }

        const passwordHash = await hashPassword(newPassword);
        user.passwordHash = passwordHash;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (error) {
        console.error("resetpassword error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
