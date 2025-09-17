// src/controllers/auth.controller.js
import User from "../models/user.model.js";
import { generateOtp, verifyOtp } from "../utils/otp.util.js";
import { hashPassword, comparePassword, generateToken } from "../utils/token.util.js";
import { sendEmail } from "../services/email.service.js";

/**
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password, pin } = req.body;

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

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(422).json({ success: false, message: "Invalid email format." });
        }

        // optional 6 digit PIN
        let pinHash = null;
        if (pin !== undefined) {
            const pinStr = String(pin);
            if (!/^\d{6}$/.test(pinStr)) {
                return res.status(422).json({ success: false, message: "PIN must be 6 digits." });
            }
            pinHash = await hashPassword(pinStr);
        }

        const passwordHash = await hashPassword(password);
        const user = await User.create({
            fullName,
            phoneNumber,
            email,
            passwordHash,
            pinHash,
            isEmailVerified: false,
        });

        // Generate & "send" OTP
        let otpCode;
        try {
            otpCode = await generateOtp(user._id, "signup");
            await sendEmail(email, `Your verification OTP is: ${otpCode}. It will expire in 10 minutes.`);
        } catch (otpError) {
            return res.status(400).json({ success: false, message: otpError.message });
        }

        // In dev (EMAIL_DISABLED=true) include OTP in response to speed testing
        const devMode = String(process.env.EMAIL_DISABLED || "").toLowerCase() === "true";
        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your email.",
            ...(devMode && { devOtp: otpCode }),
        });
    } catch (error) {
        console.error("Error in signup:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
/**
 * POST /api/auth/verify-email
 */
export const verifyemail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP required.",
            });
        }

        const user = await User.findOne({ email });
        const now = new Date();
        if (user.loginAttempts && user.loginAttempts.lockUntil && user.loginAttempts.lockUntil > now) {
            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.loginAttempts.lockUntil.toLocaleString()}.`,
            });
        }
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
 * POST /api/auth/login  (email + password)
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

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(422).json({
                success: false,
                message: "Invalid email format.",
            });
        }

        const user = await User.findOne({ email });
        const now = new Date();
        if (user.loginAttempts && user.loginAttempts.lockUntil && user.loginAttempts.lockUntil > now) {
            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.loginAttempts.lockUntil.toLocaleString()}.`,
            });
        }
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

        if (user.loginAttempts) {
            user.loginAttempts.count = 0;
            user.loginAttempts.lockUntil = null;
            await user.save();
        }
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

/**
 * POST /api/auth/login-pin  (email + PIN)
 */
export const loginWithPin = async (req, res) => {
    try {
        const { email, pin } = req.body;

        if (!email || pin === undefined) {
            return res.status(400).json({ success: false, message: "Email and PIN are required." });
        }

        const user = await User.findOne({ email });
        const now = new Date();
        if (user.loginAttempts && user.loginAttempts.lockUntil && user.loginAttempts.lockUntil > now) {
            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.loginAttempts.lockUntil.toLocaleString()}.`,
            });
        }
        if (!user) return res.status(401).json({ success: false, message: "Invalid email." });

        if (!user.isEmailVerified) {
            return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
        }

        if (!user.pinHash) {
            return res.status(400).json({ success: false, message: "No PIN set for this account." });
        }

        const ok = await comparePassword(String(pin), user.pinHash);
        if (!ok) return res.status(401).json({ success: false, message: "Invalid PIN." });

        const token = generateToken({ userId: user._id });
        if (user.loginAttempts) {
            user.loginAttempts.count = 0;
            user.loginAttempts.lockUntil = null;
            await user.save();
        }
        return res.status(200).json({ success: true, message: "Login successful.", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotpassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email",
            });
        }

        const user = await User.findOne({ email });
        const now = new Date();
        if (user.loginAttempts && user.loginAttempts.lockUntil && user.loginAttempts.lockUntil > now) {
            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.loginAttempts.lockUntil.toLocaleString()}.`,
            });
        }
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

        if (user.loginAttempts) {
            user.loginAttempts.count = 0;
            user.loginAttempts.lockUntil = null;
            await user.save();
        }
        return res.status(200).json({
            success: true,
            message: "OTP sent to email for password reset",
        });
    } catch (error) {
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

        if (!email || !newPassword || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email, new password, and OTP are required",
            });
        }

        const user = await User.findOne({ email });
        const now = new Date();
        if (user.loginAttempts && user.loginAttempts.lockUntil && user.loginAttempts.lockUntil > now) {
            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.loginAttempts.lockUntil.toLocaleString()}.`,
            });
        }
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

        if (user.loginAttempts) {
            user.loginAttempts.count = 0;
            user.loginAttempts.lockUntil = null;
            await user.save();
        }
        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};
