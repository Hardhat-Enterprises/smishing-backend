import express from "express";

import { signup, verifyemail, login, forgotpassword, resetpassword } from "../controllers/auth.controller.js";
import { sanitizeInput } from "../middlewares/sanitizeInput.js";
import { loginLimiter } from "../middlewares/rateLimiter.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { changePassword } from "../controllers/auth.controller.js";

import { loginWithPin } from "../controllers/auth.controller.js";

import {
    validate,
    signupSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../utils/validation/auth.validation.js";

import {
    generateAndSaveBackupCodes,
    verifyBackupCode,
    regenerateBackupCodes,
} from "../controllers/backupCode.controller.js";

const router = express.Router();
// POST /signup
router.post("/signup", validate(signupSchema), signup);

// POST /verify-email
router.post("/verify-email", validate(verifyEmailSchema), verifyemail);

// POST /login
router.post("/login", loginLimiter, sanitizeInput, validate(loginSchema), login);

// POST /forgot-pin
router.post("/login-pin", loginWithPin);

// POST /forgot-password
router.post("/forgot-password", validate(forgotPasswordSchema), forgotpassword);

// POST /reset-password
router.post("/reset-password", validate(resetPasswordSchema), resetpassword);

router.post("/change-password", authMiddleware, changePassword);

// Backup codes
// POST /generate-backup-codes  -> create first batch (or replace existing)
router.post("/generate-backup-codes", authMiddleware, generateAndSaveBackupCodes);

// POST /verify-backup-code     -> login using a backup code
router.post("/verify-backup-code", verifyBackupCode);

// POST /regenerate-backup-codes -> invalidate old + create new batch
router.post("/regenerate-backup-codes", authMiddleware, regenerateBackupCodes);

export default router;
