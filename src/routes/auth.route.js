import express from "express";
import { signup, login, verifyOtp, getCurrentUser } from "../controllers/auth.controller.js";
import authenticate from "../middleware/authenticate.js"; 

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);

router.get("/me", authenticate, getCurrentUser);

export default router;
console.log("auth.route.js mounted");
