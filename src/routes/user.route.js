import express from "express";
import { addGuardian, saveFcmToken } from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add-guardian", authenticate, addGuardian);
router.post("/save-fcm-token", authenticate, saveFcmToken);

export default router;
