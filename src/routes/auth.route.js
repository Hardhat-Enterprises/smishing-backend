import express from "express";

import {
    signup,
    verifyemail,
    login,
    forgotpassword,
    resetpassword,
    refreshToken,
    logout,
    logoutAllDevices,
} from "../controllers/auth.controller.js";
import { changePassword } from "../controllers/auth.controller.js";

import { loginWithPin } from "../controllers/auth.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

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

router.post("/signup", validate(signupSchema), signup);

router.post("/verify-email", validate(verifyEmailSchema), verifyemail);

router.post("/login", validate(loginSchema), login);

router.post("/login-pin", loginWithPin);

router.post("/forgot-password", validate(forgotPasswordSchema), forgotpassword);

router.post("/reset-password", validate(resetPasswordSchema), resetpassword);

router.post("/change-password", authMiddleware, changePassword);

// Secure session management
router.post("/refresh-token", refreshToken);

router.post("/logout", authMiddleware, logout);

router.post("/logout-all-devices", authMiddleware, logoutAllDevices);

// Backup codes
router.post("/generate-backup-codes", authMiddleware, generateAndSaveBackupCodes);

router.post("/verify-backup-code", verifyBackupCode);

router.post("/regenerate-backup-codes", authMiddleware, regenerateBackupCodes);

export default router;
