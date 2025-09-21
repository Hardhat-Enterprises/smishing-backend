import express from "express";
import { body } from "express-validator";
import {
    create,
    getAll,
    getById,
    updateStatus,
    deleteMessage,
    testError,
} from "../controllers/contactus.controller.js";

const router = express.Router();

const contactUsRules = [
    body("fullName").trim().notEmpty().isLength({ min: 2, max: 100 }),
    body("email").trim().isEmail().normalizeEmail(),
    body("phoneNumber")
        .optional({ nullable: true })
        .customSanitizer((v) => (v ?? "").replace(/[^\d+]/g, ""))
        .matches(/^\+?\d{7,15}$/)
        .withMessage("Phone must be 7–15 digits"),
    body("category").optional().isIn(["bug", "feedback", "support", "other"]),
    body("message").trim().isLength({ min: 10, max: 500 }),
    body("appVersion").optional().isString().isLength({ max: 50 }),
    body("deviceInfo").optional().isString().isLength({ max: 200 }),
];

// Routes
router.post("/", contactUsRules, create);
router.get("/", getAll);
router.get("/:id", getById);
router.patch("/:id", updateStatus);
router.delete("/:id", deleteMessage);

// Test error
router.get("/test-error", testError);

export default router;
