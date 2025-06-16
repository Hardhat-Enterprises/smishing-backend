import express from "express";
import {
    signup,
    verifyemail,
    login,
    forgotpassword,
    resetpassword,
    verifyPhone
} from "../controllers/auth.controller.js";


const router = express.Router();

// POST /signup
router.post("/signup", signup);

// POST /verify-email
router.post("/verify-email", verifyemail);

// POST /verify-phone (New Route for Phone Verification)
router.post("/verify-phone", verifyPhone);

// POST /login
router.post("/login", login);

// POST /forgot-password
router.post("/forgot-password", forgotpassword);

// POST /reset-password
router.post("/reset-password", resetpassword);

export default router;
