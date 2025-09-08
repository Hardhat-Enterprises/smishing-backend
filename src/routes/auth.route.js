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

router.post("/signup", signup);
router.post("/verify-email", verifyemail);
router.post("/login", login);
router.post("/login-pin", loginWithPin);
router.post("/forgot-password", forgotpassword);
router.post("/reset-password", resetpassword);

export default router;
