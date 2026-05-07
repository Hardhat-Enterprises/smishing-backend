import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { generateBackupCodes, hashBackupCodes } from "../utils/backup.util.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.util.js";

/**
 * POST /api/auth/generate-backup-codes
 * Auth required. Replaces any existing codes.
 * Returns PLAINTEXT codes once so the client can display/save them.
 */
export const generateAndSaveBackupCodes = async (req, res) => {
    try {
        const { email } = req.body;

        // include hidden field explicitly
        const user = await User.findOne({ email }).select("+backupCodes");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const plainCodes = generateBackupCodes();
        const hashed = await hashBackupCodes(plainCodes);

        user.backupCodes = hashed.map((h) => ({
            code: h.codeHash,
            used: false,
            createdAt: new Date(),
        }));
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Backup codes generated.",
            codes: plainCodes,
        });
    } catch (err) {
        console.error("generateAndSaveBackupCodes error:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

/**
 * POST /api/auth/verify-backup-code
 * Body: { email, code }
 * If valid & unused, logs user in (issues JWT) and marks that code used.
 */
export const verifyBackupCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ success: false, message: "Email and backup code are required." });
        }

        // include hidden field explicitly
        const user = await User.findOne({ email }).select("+backupCodes");
        if (!user || !Array.isArray(user.backupCodes) || user.backupCodes.length === 0) {
            // keep message generic
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        // normalize input: strip spaces/dashes, trim
        const normalize = (s) => String(s).replace(/[\s-]/g, "").trim();
        const raw = normalize(code);

        // Find a matching, unused code
        let matchedIndex = -1;
        for (let i = 0; i < user.backupCodes.length; i++) {
            const entry = user.backupCodes[i];
            if (entry.used) continue;
            const ok = await bcrypt.compare(raw, entry.code);
            if (ok) {
                matchedIndex = i;
                break;
            }
        }

        if (matchedIndex === -1) {
            return res.status(401).json({ success: false, message: "Invalid or already used backup code." });
        }

        // Mark used + audit time
        user.backupCodes[matchedIndex].used = true;
        user.backupCodes[matchedIndex].usedAt = new Date();
        await user.save();

        // const token = generateToken({ userId: user._id });
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return res.status(200).json({
            success: true,
            message: "Login successful with backup code.",
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error("verifyBackupCode error:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

/**
 * POST /api/auth/regenerate-backup-codes
 * Auth required. Replaces old batch with a new set.
 */
export const regenerateBackupCodes = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email }).select("+backupCodes");
        if (!user) return res.status(404).json({ success: false, message: "User not found." });

        const plainCodes = generateBackupCodes();
        const hashed = await hashBackupCodes(plainCodes);

        user.backupCodes = hashed.map((h) => ({
            code: h.codeHash,
            used: false,
            createdAt: new Date(),
        }));
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Backup codes regenerated.",
            codes: plainCodes,
        });
    } catch (err) {
        console.error("regenerateBackupCodes error:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};
