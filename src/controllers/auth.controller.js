import User from "../models/user.model.js";
import { generateOtp, verifyOtp } from "../utils/otp.util.js";
import { hashPassword, comparePassword, generateToken } from "../utils/token.util.js";
import { sendEmail } from "../services/email.service.js";
import LoginActivity from "../models/loginActivity.model.js";
import { getClientIP } from "../utils/ip.js";
import { isNewIPOrDevice, userAgentLabel } from "../utils/securitySignals.js";

const LOCKOUT_THRESHOLD = Number(process.env.LOCKOUT_THRESHOLD || 5);
const LOCKOUT_MINUTES = Number(process.env.LOCKOUT_MINUTES || 15);

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
