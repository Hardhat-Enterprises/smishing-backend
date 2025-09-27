import express from "express";
import { 
    getNews, 
    getNewsStats, 
    fetchNews, 
    getCategories,
    getNewsById,
    recategorizeArticles
} from "../controllers/news.controller.js";

const router = express.Router();

// GET /api/news - Get cached news with filtering
router.get("/", getNews);

// GET /api/news/stats - Get news statistics
router.get("/stats", getNewsStats);

// GET /api/news/categories - Get available categories
router.get("/categories", getCategories);

// POST /api/news/fetch - Manually trigger news fetch
router.post("/fetch", fetchNews);

// POST /api/news/recategorize - Re-categorize existing articles
router.post("/recategorize", recategorizeArticles);

// GET /api/news/:id - Get single article by ID
router.get("/:id", getNewsById);

export default router;