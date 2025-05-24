import express from "express";
import contactController from "../controllers/contact.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// POST /
router.post("/", contactController.addContact);

// GET /
router.get("/:userId", contactController.getContacts);

// PUT /
router.put("/:id", contactController.updateContact);

// DELETE /
router.delete("/:id", contactController.deleteContact);

export default router;
