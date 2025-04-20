import express from "express";
import { signup, verifyemail, login, forgotpassword, resetpassword } from "../controllers/auth.controller.js";

const router = express.Router();

// POST /signup
router.post("/signup", signup);

// POST /verifyemail
router.post("/verifyemail", verifyemail);

// POST /login
router.post("/login", login);

//POST /forgotpassword
router.post("/forgotpassword", forgotpassword);

//POST /resetpassword
router.post("/resetpassword", resetpassword);

export default router;
