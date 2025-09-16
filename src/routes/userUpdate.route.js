import express from "express";
import { getProfile, previewUpdate, updateProfile } from "../controllers/userUpdate.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Verifies JWT & credentials
router.use(authMiddleware);

// GET /me
router.get("/me", getProfile);

// POST /preview -> preview update (no DB changes)
router.post("/preview", previewUpdate);

// PUT /update
router.put("/update", updateProfile);

export default router;
