import express from "express";
import {
    signup,
    verifyemail,
    login,
    forgotpassword,
    resetpassword,
    loginWithPin,
} from "../controllers/auth.controller.js";

const router = express.Router();
// POST /signup
router.post("/signup", signup);

// POST /verify-email
router.post("/verify-email", verifyemail);

// POST /login
router.post("/login", login);

// POST /forgot-pin
router.post("/login-pin", loginWithPin);

// POST /forgot-password
router.post("/forgot-password", forgotpassword);

// POST /reset-password
router.post("/reset-password", resetpassword);

export default router;
