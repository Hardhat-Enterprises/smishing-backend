// src/controllers/auth.controller.js
import User from "../models/user.model.js";
import { generateOtp, verifyOtp } from "../utils/otp.util.js";
import { hashPassword, comparePassword, generateToken } from "../utils/token.util.js";
import { sendEmail } from "../services/email.service.js";
import LoginActivity from "../models/loginActivity.model.js";
import { getClientIP } from "../utils/ip.js";
import { isNewIPOrDevice, userAgentLabel } from "../utils/securitySignals.js";
import bcrypt from "bcrypt";
import { logSecurityEvent } from "../services/securityAudit.service.js";
import { detectSuspiciousLoginActivity } from "../services/suspiciousLogin.service.js";

const LOCKOUT_THRESHOLD = Number(process.env.LOCKOUT_THRESHOLD || 5);
const LOCKOUT_MINUTES = Number(process.env.LOCKOUT_MINUTES || 15);

/**
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password, pin } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await logSecurityEvent({
                email,
                eventType: "SIGNUP_FAILED",
                status: "failure",
                severity: "low",
                ip: getClientIP(req),
                userAgent: req.get("user-agent") || "",
                details: "Signup failed because email already exists.",
            });

            return res.status(409).json({
                success: false,
                message: "Unable to register. Please try again.",
            });
        }

        let pinHash = null;
        if (pin !== undefined) {
            const pinStr = String(pin);
            if (!/^\d{6}$/.test(pinStr)) {
                await logSecurityEvent({
                    email,
                    eventType: "SIGNUP_FAILED",
                    status: "failure",
                    severity: "low",
                    ip: getClientIP(req),
                    userAgent: req.get("user-agent") || "",
                    details: "Signup failed because PIN was not 6 digits.",
                });

                return res.status(422).json({
                    success: false,
                    message: "PIN must be 6 digits.",
                });
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

        let otpCode;
        try {
            otpCode = await generateOtp(user._id, "signup");
            await sendEmail(email, `Your verification OTP is: ${otpCode}. It will expire in 10 minutes.`);

            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "SIGNUP_SUCCESS",
                status: "success",
                severity: "low",
                ip: getClientIP(req),
                userAgent: req.get("user-agent") || "",
                details: "User registered successfully and signup OTP was sent.",
            });
        } catch (otpError) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "SIGNUP_OTP_FAILED",
                status: "failure",
                severity: "medium",
                ip: getClientIP(req),
                userAgent: req.get("user-agent") || "",
                details: otpError.message,
            });

            return res.status(400).json({
                success: false,
                message: otpError.message,
            });
        }

        const devMode = String(process.env.EMAIL_DISABLED || "").toLowerCase() === "true";
        return res.status(201).json({
            success: true,
            message: "User registered successfully. Please verify your email.",
            ...(devMode && { devOtp: otpCode }),
        });
    } catch (error) {
        console.error("Error in signup:", error);

        await logSecurityEvent({
            email: req.body?.email || "",
            eventType: "SIGNUP_ERROR",
            status: "failure",
            severity: "high",
            ip: getClientIP(req),
            userAgent: req.get("user-agent") || "",
            details: error.message,
        });

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
        const ip = getClientIP(req);
        const ua = req.get("user-agent") || "";

        const user = await User.findOne({ email });
        const now = new Date();

        if (!user) {
            await logSecurityEvent({
                email,
                eventType: "EMAIL_VERIFICATION_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "Email verification failed because user was not found.",
            });

            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (user?.security?.lockUntil && user.security.lockUntil > now) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "EMAIL_VERIFICATION_BLOCKED",
                status: "warning",
                severity: "high",
                ip,
                userAgent: ua,
                details: `Email verification blocked because account is locked until ${user.security.lockUntil.toISOString()}.`,
            });

            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.security.lockUntil.toLocaleString()}.`,
            });
        }

        const result = await verifyOtp(user._id, "signup", otp);

        if (!result.success) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "EMAIL_VERIFICATION_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: result.message || "Invalid OTP during email verification.",
            });

            return res.status(400).json({
                success: false,
                attemptsLeft: result.attemptsLeft,
                lockoutUntil: result.lockoutUntil,
                message: result.message || "Invalid OTP.",
            });
        }

        user.isEmailVerified = true;
        await user.save();

        await logSecurityEvent({
            userId: user._id,
            email: user.email,
            eventType: "EMAIL_VERIFIED",
            status: "success",
            severity: "low",
            ip,
            userAgent: ua,
            details: "Email verified successfully.",
        });

        return res.json({
            success: true,
            message: "Email verified successfully.",
        });
    } catch (error) {
        console.error("verifyemail error", error);

        await logSecurityEvent({
            email: req.body?.email || "",
            eventType: "EMAIL_VERIFICATION_ERROR",
            status: "failure",
            severity: "high",
            ip: getClientIP(req),
            userAgent: req.get("user-agent") || "",
            details: error.message,
        });

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
        const ip = getClientIP(req);
        const ua = req.get("user-agent") || "";

        const user = await User.findOne({ email });

        if (!user) {
            await logSecurityEvent({
                email,
                eventType: "LOGIN_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "Login failed due to invalid email.",
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email.",
            });
        }

        const now = new Date();

        if (user?.security?.lockUntil && user.security.lockUntil > now) {
            await LoginActivity.create({
                userId: user._id,
                ip,
                userAgent: ua,
                success: false,
            });

            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "ACCOUNT_LOCKED_LOGIN_ATTEMPT",
                status: "warning",
                severity: "high",
                ip,
                userAgent: ua,
                details: "Login attempted while account was locked.",
            });

            return res.status(423).json({
                success: false,
                message: `Account locked. Try again after ${user.security.lockUntil.toLocaleString()}.`,
            });
        }

        const isMatch = await comparePassword(password, user.passwordHash);

        if (!isMatch) {
            user.security = user.security || {};
            user.security.failedLogins = (user.security.failedLogins || 0) + 1;

            const attemptsLeft = LOCKOUT_THRESHOLD - user.security.failedLogins;

            if (user.security.failedLogins >= LOCKOUT_THRESHOLD) {
                user.security.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
                user.security.failedLogins = 0;

                await user.save();

                await LoginActivity.create({
                    userId: user._id,
                    ip,
                    userAgent: ua,
                    success: false,
                });

                await logSecurityEvent({
                    userId: user._id,
                    email: user.email,
                    eventType: "ACCOUNT_LOCKED",
                    status: "warning",
                    severity: "high",
                    ip,
                    userAgent: ua,
                    details: `Account locked after reaching failed login threshold. Locked until ${user.security.lockUntil.toISOString()}.`,
                });

                await detectSuspiciousLoginActivity({
                    userId: user._id,
                    email: user.email,
                    ip,
                    userAgent: ua,
                });

                return res.status(423).json({
                    success: false,
                    message: `Account locked due to multiple failed login attempts. Try again after ${user.security.lockUntil.toLocaleString()}.`,
                });
            }

            await user.save();

            await LoginActivity.create({
                userId: user._id,
                ip,
                userAgent: ua,
                success: false,
            });

            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "LOGIN_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: `Invalid password. Attempts left: ${attemptsLeft}`,
            });

            await detectSuspiciousLoginActivity({
                userId: user._id,
                email: user.email,
                ip,
                userAgent: ua,
            });

            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
                attemptsLeft,
            });
        }

        if (!user.isEmailVerified) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "LOGIN_BLOCKED_UNVERIFIED_EMAIL",
                status: "warning",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "Login blocked because email is not verified.",
            });

            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
            });
        }

        user.security = user.security || {};
        user.security.failedLogins = 0;
        user.security.lockUntil = null;

        await LoginActivity.create({
            userId: user._id,
            ip,
            userAgent: ua,
            success: true,
            factorsUsed: ["password"],
        });

        const { changed } = isNewIPOrDevice(user, ip, ua);
        if (changed && (user.security.loginAlerts ?? true)) {
            const uaLabel = userAgentLabel(ua);
            const body = `We noticed a new login to your account.

Time:   ${new Date().toISOString()}
IP:     ${ip}
Device: ${uaLabel}

If this wasn't you, please reset your password immediately.`;

            sendEmail(user.email, body)
                .then(async () => {
                    await LoginActivity.updateOne(
                        { userId: user._id, ip, userAgent: ua, success: true },
                        { $set: { alerted: true } },
                        { sort: { at: -1 } },
                    );
                })
                .catch(() => {});
        }

        user.security.lastLoginAt = new Date();
        user.security.lastLoginIP = ip;
        user.security.lastLoginUA = ua;
        await user.save();

        const token = generateToken({ userId: user._id });

        await logSecurityEvent({
            userId: user._id,
            email: user.email,
            eventType: "LOGIN_SUCCESS",
            status: "success",
            severity: "low",
            ip,
            userAgent: ua,
            details: "User logged in successfully.",
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
        });
    } catch (error) {
        console.error("login error", error);

        await logSecurityEvent({
            email: req.body?.email || "",
            eventType: "LOGIN_ERROR",
            status: "failure",
            severity: "high",
            ip: getClientIP(req),
            userAgent: req.get("user-agent") || "",
            details: error.message,
        });

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
        const ip = getClientIP(req);
        const ua = req.get("user-agent") || "";

        if (!email || pin === undefined) {
            return res.status(400).json({
                success: false,
                message: "Email and PIN are required.",
            });
        }

        const user = await User.findOne({ email });
        const now = new Date();

        if (!user) {
            await logSecurityEvent({
                email,
                eventType: "PIN_LOGIN_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "PIN login failed due to invalid email.",
            });

            return res.status(401).json({
                success: false,
                message: "Invalid email.",
            });
        }

        if (user?.security?.lockUntil && user.security.lockUntil > now) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PIN_LOGIN_BLOCKED",
                status: "warning",
                severity: "high",
                ip,
                userAgent: ua,
                details: "PIN login attempted while account was locked.",
            });

            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.security.lockUntil.toLocaleString()}.`,
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
            });
        }

        if (!user.pinHash) {
            return res.status(400).json({
                success: false,
                message: "No PIN set for this account.",
            });
        }

        const ok = await comparePassword(String(pin), user.pinHash);
        if (!ok) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PIN_LOGIN_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "PIN login failed due to invalid PIN.",
            });

            return res.status(401).json({
                success: false,
                message: "Invalid PIN.",
            });
        }

        user.security = user.security || {};
        user.security.failedLogins = 0;
        user.security.lockUntil = null;
        await user.save();

        const token = generateToken({ userId: user._id });

        await logSecurityEvent({
            userId: user._id,
            email: user.email,
            eventType: "PIN_LOGIN_SUCCESS",
            status: "success",
            severity: "low",
            ip,
            userAgent: ua,
            details: "User logged in successfully using PIN.",
        });

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
        });
    } catch (error) {
        console.error("loginWithPin error", error);

        await logSecurityEvent({
            email: req.body?.email || "",
            eventType: "PIN_LOGIN_ERROR",
            status: "failure",
            severity: "high",
            ip: getClientIP(req),
            userAgent: req.get("user-agent") || "",
            details: error.message,
        });

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
        const ip = getClientIP(req);
        const ua = req.get("user-agent") || "";

        const user = await User.findOne({ email });
        const now = new Date();

        if (!user) {
            await logSecurityEvent({
                email,
                eventType: "PASSWORD_RESET_REQUEST_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "Password reset request failed because user was not found.",
            });

            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user?.security?.lockUntil && user.security.lockUntil > now) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PASSWORD_RESET_REQUEST_BLOCKED",
                status: "warning",
                severity: "high",
                ip,
                userAgent: ua,
                details: `Password reset request blocked because account is locked until ${user.security.lockUntil.toISOString()}.`,
            });

            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.security.lockUntil.toLocaleString()}.`,
            });
        }

        try {
            const otpCode = await generateOtp(user._id, "resetpassword");
            await sendEmail(email, `Your OTP to reset your password is: ${otpCode}. It will expire in 10 minutes.`);

            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PASSWORD_RESET_OTP_SENT",
                status: "success",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "Password reset OTP sent to email.",
            });
        } catch (otpError) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PASSWORD_RESET_OTP_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: otpError.message,
            });

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
        console.error("forgotpassword error", error);

        await logSecurityEvent({
            email: req.body?.email || "",
            eventType: "PASSWORD_RESET_REQUEST_ERROR",
            status: "failure",
            severity: "high",
            ip: getClientIP(req),
            userAgent: req.get("user-agent") || "",
            details: error.message,
        });

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
        const ip = getClientIP(req);
        const ua = req.get("user-agent") || "";

        const user = await User.findOne({ email });
        const now = new Date();

        if (!user) {
            await logSecurityEvent({
                email,
                eventType: "PASSWORD_RESET_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "Password reset failed because user was not found.",
            });

            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user?.security?.lockUntil && user.security.lockUntil > now) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PASSWORD_RESET_BLOCKED",
                status: "warning",
                severity: "high",
                ip,
                userAgent: ua,
                details: `Password reset blocked because account is locked until ${user.security.lockUntil.toISOString()}.`,
            });

            return res.status(429).json({
                success: false,
                message: `Account locked. Try again after ${user.security.lockUntil.toLocaleString()}.`,
            });
        }

        const result = await verifyOtp(user._id, "resetpassword", otp);

        if (!result.success) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PASSWORD_RESET_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: result.message || "Invalid or expired OTP during password reset.",
            });

            return res.status(400).json({
                success: false,
                attemptsLeft: result.attemptsLeft,
                lockoutUntil: result.lockoutUntil,
                message: result.message || "Invalid or expired OTP.",
            });
        }

        const passwordHash = await hashPassword(newPassword);
        user.passwordHash = passwordHash;
        user.security = user.security || {};
        user.security.failedLogins = 0;
        user.security.lockUntil = null;
        await user.save();

        await logSecurityEvent({
            userId: user._id,
            email: user.email,
            eventType: "PASSWORD_RESET_SUCCESS",
            status: "success",
            severity: "high",
            ip,
            userAgent: ua,
            details: "Password reset completed successfully.",
        });

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (error) {
        console.error("resetpassword error", error);

        await logSecurityEvent({
            email: req.body?.email || "",
            eventType: "PASSWORD_RESET_ERROR",
            status: "failure",
            severity: "high",
            ip: getClientIP(req),
            userAgent: req.get("user-agent") || "",
            details: error.message,
        });

        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword, confirmNewPassword }
 * Auth: Required (Bearer token via authMiddleware)
 */
export const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const ip = getClientIP(req);
        const ua = req.get("user-agent") || "";

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthenticated",
            });
        }

        const { currentPassword, newPassword, confirmNewPassword } = req.body || {};

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        const user = await User.findById(userId).select("+passwordHash +tokenVersion +email");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PASSWORD_CHANGE_FAILED",
                status: "failure",
                severity: "medium",
                ip,
                userAgent: ua,
                details: "Password change failed due to incorrect current password.",
            });

            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
        if (sameAsOld) {
            await logSecurityEvent({
                userId: user._id,
                email: user.email,
                eventType: "PASSWORD_CHANGE_FAILED",
                status: "failure",
                severity: "low",
                ip,
                userAgent: ua,
                details: "Password change failed because new password matched current password.",
            });

            return res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
        }

        const cost = 12;
        user.passwordHash = await bcrypt.hash(newPassword, cost);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.passwordUpdatedAt = new Date();

        await user.save();

        await logSecurityEvent({
            userId: user._id,
            email: user.email,
            eventType: "PASSWORD_CHANGED",
            status: "success",
            severity: "high",
            ip,
            userAgent: ua,
            details: "Password changed successfully.",
        });

        return res.status(200).json({
            success: true,
            message: "Password changed. Please sign in again.",
        });
    } catch (err) {
        console.error("changePassword error:", err);

        await logSecurityEvent({
            userId: req.user?.id || null,
            email: "",
            eventType: "PASSWORD_CHANGE_ERROR",
            status: "failure",
            severity: "high",
            ip: getClientIP(req),
            userAgent: req.get("user-agent") || "",
            details: err.message,
        });

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
