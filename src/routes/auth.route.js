import express from "express";
import { signup, verifyemail, login, forgotpassword, resetpassword } from "../controllers/auth.controller.js";
import { sanitizeInput } from "../middlewares/sanitizeInput.js";
import { loginLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// POST /signup
router.post("/signup", signup);

// POST /verify-email
router.post("/verify-email", verifyemail);

// POST /login
router.post("/login", loginLimiter, sanitizeInput, login);

// POST /forgot-password
router.post("/forgot-password", forgotpassword);

// POST /reset-password
router.post("/reset-password", resetpassword);

export default router;
