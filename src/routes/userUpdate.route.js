import express from "express";
import {
    getProfile,
    previewUpdate,
    updateProfile,
    deactivateAccount,
    reactivateAccount,
    deleteAccount,
} from "../controllers/userUpdate.controller.js";
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

// PATCH /deactivate
router.patch("/deactivate", deactivateAccount);

// PATCH /reactivate
router.patch("/reactivate", reactivateAccount);

// DELETE /delete
router.delete("/delete", deleteAccount);

export default router;
