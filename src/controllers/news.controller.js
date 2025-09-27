import NewsFetcherService from "../services/newsFetcher.service.js";

const newsFetcher = new NewsFetcherService();

/**
 * GET /api/news
 * Get cached cybersecurity articles with filtering and pagination
 * Only returns cybersecurity-related news articles
 */
export const getNews = async (req, res) => {
    try {
        const {
            category,
            limit = 20,
            page = 1,
            search,
            tags,
            sortBy = "publishedAt",
            sortOrder = "desc"
        } = req.query;

        // Validate cybersecurity categories only
        const validCategories = ["cybersecurity", "data-breach", "malware", "phishing"];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: `Invalid category. Must be one of: ${validCategories.join(", ")}`
            });
        }

        // Validate parameters
        const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per request
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const sortOrderNum = sortOrder === "asc" ? 1 : -1;

        const options = {
            category,
            limit: limitNum,
            page: pageNum,
            search,
            tags: tags ? tags.split(",") : undefined,
            sortBy,
            sortOrder: sortOrderNum
        };

        const result = await newsFetcher.getCachedNews(options);

        return res.json({
            success: true,
            data: result.articles,
            pagination: result.pagination,
            message: `Retrieved ${result.articles.length} cybersecurity articles`
        });

    } catch (error) {
        console.error("Error in getNews:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve cybersecurity news articles"
        });
    }
};

/**
 * GET /api/news/stats
 * Get news cache statistics
 */
export const getNewsStats = async (req, res) => {
    try {
        const stats = await newsFetcher.getNewsStats();

        return res.json({
            success: true,
            data: stats,
            message: "News statistics retrieved successfully"
        });

    } catch (error) {
        console.error("Error in getNewsStats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve news statistics"
        });
    }
};

/**
 * POST /api/news/fetch
 * Manually trigger cybersecurity news fetch (admin endpoint)
 */
export const fetchNews = async (req, res) => {
    try {
        const result = await newsFetcher.fetchAndStoreNews();

        return res.json({
            success: true,
            data: result,
            message: `Cybersecurity news fetch completed. ${result.totalStored} articles stored.`
        });

    } catch (error) {
        console.error("Error in fetchNews:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch cybersecurity news articles"
        });
    }
};

/**
 * GET /api/news/categories
 * Get available cybersecurity news categories
 * Returns only cybersecurity-related categories
 */
export const getCategories = async (req, res) => {
    try {
        // Only cybersecurity categories - no "general" category
        const categories = ["cybersecurity", "data-breach", "malware", "phishing"];
        
        return res.json({
            success: true,
            data: categories,
            message: "Cybersecurity categories retrieved successfully"
        });

    } catch (error) {
        console.error("Error in getCategories:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve categories"
        });
    }
};

/**
 * GET /api/news/:id
 * Get single news article by ID
 */
export const getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const article = await newsFetcher.getCachedNews({ 
            limit: 1, 
            page: 1,
            // Add ID filter - we'll need to modify getCachedNews for this
        });

        if (!article.articles.length) {
            return res.status(404).json({
                success: false,
                message: "Article not found"
            });
        }

        return res.json({
            success: true,
            data: article.articles[0],
            message: "Article retrieved successfully"
        });

    } catch (error) {
        console.error("Error in getNewsById:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve article"
        });
    }
};

/**
 * POST /api/news/recategorize
 * Re-categorize existing articles with improved cybersecurity logic (admin endpoint)
 * Marks non-cybersecurity articles as inactive
 */
export const recategorizeArticles = async (req, res) => {
    try {
        const result = await newsFetcher.recategorizeExistingArticles();

        return res.json({
            success: true,
            data: result,
            message: `Cybersecurity re-categorization completed. ${result.updated} articles updated, ${result.markedInactive} non-cyber articles marked inactive.`
        });

    } catch (error) {
        console.error("Error in recategorizeArticles:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to re-categorize articles"
        });
    }
};