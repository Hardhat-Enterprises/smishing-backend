import express from "express";
import { getNotificationsForGuardian, testPush } from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/notifications (uses token, not manual userId in URL)
router.get("/", authenticate, getNotificationsForGuardian);

// POST /api/notifications/test-push
router.post("/test-push", authenticate, testPush);

export default router;
