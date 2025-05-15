import express from "express";
import { getWhitelist, addToWhitelist, removeFromWhitelist} from "../controllers/whitelist.controller.js";

const router = express.Router();

// GET /getWhitelist
router.get("/getWhitelist", getWhitelist);

// POST /addToWhitelist
router.post("/addToWhitelist", addToWhitelist);

// DELETE /removeFromWhitelist
router.delete("/removeFromWhitelist", removeFromWhitelist);

export default router;
