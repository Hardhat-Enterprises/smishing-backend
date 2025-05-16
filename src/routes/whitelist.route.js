import express from "express";
import { get, add, remove} from "../controllers/whitelist.controller.js";

const router = express.Router();

// GET /get
router.get("/get", get);

// POST /add
router.post("/add", add);

// DELETE /remove
router.delete("/remove", remove);

export default router;
