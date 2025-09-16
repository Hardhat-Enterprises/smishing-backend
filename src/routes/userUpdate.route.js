import express from "express";
import { getProfile, updateProfile } from "../controllers/userUpdate.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Verifies JWT & credentials
router.use(authMiddleware);

// GET /me
router.get("/me", getProfile);

// PUT /update
router.put("/update", updateProfile);

export default router;
