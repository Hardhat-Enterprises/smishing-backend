import express from "express";
const router = express.Router();
import { searchNews } from "../controllers/news.controller.js";

router.get("/search", searchNews);

export default router;
