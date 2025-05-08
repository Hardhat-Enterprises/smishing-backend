import express from "express";
import { signup, verifyOtp, login } from "../controllers/auth.controller.js";

const router = express.Router();

// POST /signup
router.post("/signup", signup);

// POST /verify-otp
router.post("/verify-otp", verifyOtp);

// POST /login
router.post("/login", login);

export default router;
