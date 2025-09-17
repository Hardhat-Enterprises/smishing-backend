import express from "express";
import { signup, verifyemail, login, forgotpassword, resetpassword } from "../controllers/auth.controller.js";
import {
    validate,
    signupSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../utils/validation/auth.validation.js";
const router = express.Router();

// POST /signup
router.post("/signup", validate(signupSchema), signup);

// POST /verify-email
router.post("/verify-email", validate(verifyEmailSchema), verifyemail);

// POST /login
router.post("/login", validate(loginSchema), login);

// POST /forgot-password
router.post("/forgot-password", validate(forgotPasswordSchema), forgotpassword);

// POST /reset-password
router.post("/reset-password", validate(resetPasswordSchema), resetpassword);

export default router;
