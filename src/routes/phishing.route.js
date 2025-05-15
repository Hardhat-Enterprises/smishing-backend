import express from "express";
import { reportPhishing } from "../controllers/phishing.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, reportPhishing);

export default router;
