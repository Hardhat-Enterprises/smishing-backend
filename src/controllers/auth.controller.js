// src/controllers/auth.controller.js
import User from "../models/user.model.js";
import { generateOtp, verifyOtp } from "../utils/otp.util.js";
import { hashPassword, comparePassword, generateToken } from "../utils/token.util.js";
import { sendEmail } from "../services/email.service.js";
import LoginActivity from "../models/loginActivity.model.js";
import { getClientIP } from "../utils/ip.js";
import { isNewIPOrDevice, userAgentLabel } from "../utils/securitySignals.js";
import bcrypt from "bcrypt";

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
            return res.status(409).json({
                success: false,
                message: "Unable to register. Please try again.",
            });
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

        const user = await User.findOne({ email });
        const now1 = new Date();
        if (user.loginAttempts && user.loginAttempts.lockUntil && user.loginAttempts.lockUntil > now1) {
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

        // --- NEW: get client IP/UA and check lockout ---
        const ip = getClientIP(req);
        const ua = req.get("user-agent") || "";
        const now = new Date();

        if (user?.security?.lockUntil && user.security.lockUntil > now) {
            await LoginActivity.create({ userId: user._id, ip, userAgent: ua, success: false });
            return res.status(423).json({
                success: false,
                message: "Account locked. Try again later.",
            });
        }

        /*const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }
*/
        const isMatch = await comparePassword(password, user.passwordHash);
        if (!isMatch) {
            // increment failure count + maybe lock
            user.security = user.security || {};
            user.security.failedLogins = (user.security.failedLogins || 0) + 1;

            if (user.security.failedLogins >= LOCKOUT_THRESHOLD) {
                user.security.lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
                user.security.failedLogins = 0; // reset after locking
            }

            await user.save();
            await LoginActivity.create({ userId: user._id, ip, userAgent: ua, success: false });

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
        // --- NEW: success path bookkeeping ---
        // reset counters
        user.security = user.security || {};
        user.security.failedLogins = 0;
        user.security.lockUntil = null;

        // record success activity
        await LoginActivity.create({
            userId: user._id,
            ip,
            userAgent: ua,
            success: true,
            factorsUsed: ["password"],
        });

        // send alert on new IP/device (non-blocking)
        const { changed } = isNewIPOrDevice(user, ip, ua);
        if (changed && (user.security.loginAlerts ?? true)) {
            const uaLabel = userAgentLabel(ua);
            const body = `We noticed a new login to your account.

         Time:   ${new Date().toISOString()}
         IP:     ${ip}
         Device: ${uaLabel}

         If this wasn't you, please reset your password immediately.`;

            // fire & forget; don’t block login
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

        // update baseline for next time
        user.security.lastLoginAt = new Date();
        user.security.lastLoginIP = ip;
        user.security.lastLoginUA = ua;
        await user.save();

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
        console.error("login error", error);
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
        console.error("resetpassword error", error);
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
        const userId = req.user?.id; // set by authMiddleware
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthenticated" });
        }

        const { currentPassword, newPassword, confirmNewPassword } = req.body || {};
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        const user = await User.findById(userId).select("+passwordHash +tokenVersion +email");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // verify current password
        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }

        // block reusing the same password
        const sameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
        if (sameAsOld) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
        }

        // hash new password
        const cost = 12; // tune to ~200–300ms on your server
        user.passwordHash = await bcrypt.hash(newPassword, cost);

        // invalidate existing sessions/refresh tokens if you use them
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.passwordUpdatedAt = new Date();

        await user.save();

        // Optional: send security email / log event here

        return res.status(200).json({ success: true, message: "Password changed. Please sign in again." });
    } catch (err) {
        console.error("changePassword error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
