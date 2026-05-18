import express from "express";
import {
    getProfile,
    previewUpdate,
    updateProfile,
    deactivateAccount,
    reactivateAccount,
    deleteAccount,
    getSecureProfile,
    get2FASettings,
    regenerateTotpBackupCodes,
} from "../controllers/userUpdate.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Verifies JWT & credentials
router.use(authMiddleware);

// GET /me
router.get("/me", getProfile);

// GET /secure-profile - Returns profile with 2FA info (IDOR protected)
router.get("/secure-profile", getSecureProfile);

// GET /2fa-settings - View current 2FA settings
router.get("/2fa-settings", get2FASettings);

// POST /preview -> preview update (no DB changes)
router.post("/preview", previewUpdate);

// PUT /update
router.put("/update", updateProfile);

// POST /regenerate-backup-codes - Regenerate backup codes
router.post("/regenerate-backup-codes", regenerateTotpBackupCodes);

// PATCH /deactivate
router.patch("/deactivate", deactivateAccount);

// PATCH /reactivate
router.patch("/reactivate", reactivateAccount);

// DELETE /delete
router.delete("/delete", deleteAccount);

export default router;
