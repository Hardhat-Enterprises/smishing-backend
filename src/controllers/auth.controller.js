import User from "../models/user.model.js";
import { generateOtp, verifyOtp } from "../utils/otp.util.js";
import { hashPassword, comparePassword, generateToken } from "../utils/token.util.js";
import { sendEmail } from "../services/email.service.js";
import { sendVerificationCode } from "../services/phone.service.js";
import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * POST /api/auth/signup
 */
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
            isPhoneVerified: false, // Add this if it is not there
        });

        // 🔹 Send OTP to the user's phone
        try {
            const response = await client.verify
                .services(process.env.TWILIO_SERVICE_ID)
                .verifications.create({
                    to: phoneNumber,
                    channel: "sms",
                });

            console.log(`✅ Verification code sent to ${phoneNumber}`, response.sid);
        } catch (otpError) {
            console.error(`❌ Failed to send OTP: ${otpError.message}`);
            return res.status(400).json({
                success: false,
                message: "Failed to send OTP for phone verification.",
            });
        }

        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your phone number.",
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
 * POST /api/auth/verify-phone
 */
export const verifyPhone = async (req, res) => {
    try {
        const { phoneNumber, code } = req.body;

        if (!phoneNumber || !code) {
            return res.status(400).json({
                success: false,
                message: "Phone number and code are required.",
            });
        }

        const verificationCheck = await client.verify
            .services(process.env.TWILIO_SERVICE_ID)
            .verificationChecks.create({
                to: phoneNumber,
                code: code,
            });

        if (verificationCheck.status === "approved") {
            await User.findOneAndUpdate(
                { phoneNumber },
                { isPhoneVerified: true }
            );

            return res.status(200).json({
                success: true,
                message: "Phone number verified successfully.",
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code.",
            });
        }
    } catch (error) {
        console.error("Error in phone verification:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
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

        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            return res.status(422).json({
                success: false,
                message: "Invalid email format.",
            });
        }

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
         // 🔹 Check if phone number is verified
         if (!user.isPhoneVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your phone number before logging in.",
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
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};