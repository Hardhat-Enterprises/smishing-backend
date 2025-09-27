import News from "../models/news.model.js";
import { NewsApiService, GuardianApiService } from "./newsApi.service.js";

class NewsFetcherService {
    constructor() {
        this.newsApiService = new NewsApiService();
        this.guardianApiService = new GuardianApiService();
    }

    /**
     * Fetch and store cybersecurity news from all configured sources
     * Optimized to store ONLY cybersecurity-related articles
     */
    async fetchAndStoreNews() {
        console.log("🔄 Starting cybersecurity news fetch process...");
        
        let totalFetched = 0;
        let totalStored = 0;
        const results = {
            newsapi: { fetched: 0, stored: 0, errors: [] },
            guardian: { fetched: 0, stored: 0, errors: [] }
        };

        // Fetch from NewsAPI
        try {
            console.log("📰 Attempting to fetch cybersecurity news from NewsAPI...");
            const newsApiArticles = await this.newsApiService.fetchCyberNews();
            results.newsapi.fetched = newsApiArticles.length;
            console.log(`📰 NewsAPI returned ${newsApiArticles.length} cybersecurity articles`);
            
            const storedCount = await this.storeArticles(newsApiArticles, this.newsApiService);
            results.newsapi.stored = storedCount;
            totalStored += storedCount;
            console.log(`💾 Stored ${storedCount} articles from NewsAPI`);
        } catch (error) {
            results.newsapi.errors.push(error.message);
            console.error("🚫 NewsAPI fetch failed:", error.message);
            if (error.message.includes('400')) {
                console.error("🔍 Possible causes: Query too long, invalid parameters, or API key issues");
            }
        }

        // Fetch from Guardian (if NewsAPI fails or as supplement)
        try {
            console.log("📰 Attempting to fetch cybersecurity news from Guardian API...");
            const guardianArticles = await this.guardianApiService.fetchCyberNews();
            results.guardian.fetched = guardianArticles.length;
            console.log(`📰 Guardian returned ${guardianArticles.length} cybersecurity articles`);
            
            const storedCount = await this.storeArticles(guardianArticles, this.guardianApiService);
            results.guardian.stored = storedCount;
            totalStored += storedCount;
            console.log(`💾 Stored ${storedCount} articles from Guardian`);
        } catch (error) {
            results.guardian.errors.push(error.message);
            console.error("🚫 Guardian API fetch failed:", error.message);
        }

        // Clean up old articles (keep last 30 days)
        await this.cleanupOldArticles();

        console.log(`✅ Cybersecurity news fetch completed. Total stored: ${totalStored}`);
        return {
            success: true,
            totalStored,
            results,
            timestamp: new Date()
        };
    }

    /**
     * Store cybersecurity articles in database, avoiding duplicates
     * Enhanced filtering to ensure ONLY cybersecurity content is stored
     */
    async storeArticles(articles, service) {
        let storedCount = 0;
        let skippedCount = 0;
        let rejectedCount = 0;

        for (const article of articles) {
            try {
                // Skip articles without required fields
                if (!article.title || !article.url || !article.publishedAt) {
                    skippedCount++;
                    continue;
                }

                // Double-check cybersecurity relevance (articles should already be filtered)
                if (service.isRelevantArticle && !service.isRelevantArticle(article)) {
                    rejectedCount++;
                    continue;
                }

                // Check if article already exists
                const existingArticle = await News.findOne({ url: article.url });
                if (existingArticle) {
                    skippedCount++;
                    continue;
                }

                // Categorize article (should never be "general" or "non-cybersecurity" now)
                const category = service.categorizeArticle ? service.categorizeArticle(article) : "cybersecurity";
                
                // Final safety check - reject if categorized as non-cybersecurity
                if (category === "non-cybersecurity") {
                    rejectedCount++;
                    continue;
                }
                
                // Additional validation - ensure category is valid
                const validCategories = ["cybersecurity", "data-breach", "malware", "phishing"];
                if (!validCategories.includes(category)) {
                    rejectedCount++;
                    continue;
                }

                // Prepare cybersecurity article data
                const newsData = {
                    title: article.title,
                    description: article.description || "",
                    content: article.content || article.description || "",
                    url: article.url,
                    urlToImage: article.urlToImage,
                    publishedAt: new Date(article.publishedAt),
                    source: {
                        name: article.source?.name || "Unknown",
                        id: article.source?.id || null
                    },
                    author: article.author,
                    category: category,
                    tags: service.extractTags ? service.extractTags(article) : [],
                    fetchedAt: new Date(),
                    isActive: true
                };

                // Store the cybersecurity article
                await News.create(newsData);
                storedCount++;

            } catch (error) {
                console.error(`Error storing cybersecurity article: ${article.title}`, error.message);
                rejectedCount++;
            }
        }

        if (skippedCount > 0) {
            console.log(`📝 Skipped ${skippedCount} duplicate/invalid articles`);
        }
        if (rejectedCount > 0) {
            console.log(`❌ Rejected ${rejectedCount} non-cybersecurity articles`);
        }

        return storedCount;
    }

    /**
     * Clean up articles older than specified days
     */
    async cleanupOldArticles(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const result = await News.deleteMany({
                publishedAt: { $lt: cutoffDate }
            });

            console.log(`🧹 Cleaned up ${result.deletedCount} old articles`);
            return result.deletedCount;
        } catch (error) {
            console.error("Error cleaning up old articles:", error);
            return 0;
        }
    }

    /**
     * Get cached cybersecurity news with filtering options
     * Only returns cybersecurity-related articles
     */
    async getCachedNews(options = {}) {
        const {
            category,
            limit = 20,
            page = 1,
            sortBy = "publishedAt",
            sortOrder = -1,
            search,
            tags
        } = options;

        try {
            // Build query - always filter for active cybersecurity articles only
            const query = { 
                isActive: true,
                category: { $in: ["cybersecurity", "data-breach", "malware", "phishing"] } // Exclude any potential "general" articles
            };
            
            // Add category filter if specified (must be cybersecurity-related)
            if (category && ["cybersecurity", "data-breach", "malware", "phishing"].includes(category)) {
                query.category = category;
            }
            
            // Add search filter
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } }
                ];
            }
            
            // Add tags filter
            if (tags && tags.length > 0) {
                query.tags = { $in: tags };
            }

            // Execute query with pagination
            const skip = (page - 1) * limit;
            const articles = await News.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await News.countDocuments(query);

            return {
                articles,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error("Error fetching cached cybersecurity news:", error);
            throw error;
        }
    }

    /**
     * Get news statistics
     */
    async getNewsStats() {
        try {
            const stats = await News.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: "$category",
                        count: { $sum: 1 },
                        latestArticle: { $max: "$publishedAt" }
                    }
                }
            ]);

            const totalArticles = await News.countDocuments({ isActive: true });
            const lastFetch = await News.findOne({}, {}, { sort: { fetchedAt: -1 } });

            return {
                totalArticles,
                lastFetch: lastFetch?.fetchedAt || null,
                categoriesStats: stats,
                oldestArticle: await News.findOne({ isActive: true }, {}, { sort: { publishedAt: 1 } }),
                newestArticle: await News.findOne({ isActive: true }, {}, { sort: { publishedAt: -1 } })
            };
        } catch (error) {
            console.error("Error getting news stats:", error);
            throw error;
        }
    }

    /**
     * Re-categorize existing articles using improved logic
     */
    async recategorizeExistingArticles() {
        try {
            console.log("🔄 Starting re-categorization of existing articles...");
            
            const articles = await News.find({ isActive: true });
            let updatedCount = 0;
            let markedInactiveCount = 0;
            
            for (const article of articles) {
                const mockArticle = {
                    title: article.title,
                    description: article.description,
                    content: article.content
                };
                
                // Check if article is relevant
                if (!this.newsApiService.isRelevantArticle(mockArticle)) {
                    // Mark irrelevant articles as inactive instead of deleting
                    await News.updateOne(
                        { _id: article._id },
                        { isActive: false }
                    );
                    markedInactiveCount++;
                    continue;
                }
                
                // Re-categorize relevant articles
                const newCategory = this.newsApiService.categorizeArticle(mockArticle);
                const newTags = this.newsApiService.extractTags(mockArticle);
                
                if (newCategory !== article.category || 
                    JSON.stringify(newTags) !== JSON.stringify(article.tags)) {
                    await News.updateOne(
                        { _id: article._id },
                        { 
                            category: newCategory,
                            tags: newTags
                        }
                    );
                    updatedCount++;
                }
            }
            
            console.log(`✅ Re-categorization completed:`);
            console.log(`   - Updated: ${updatedCount} articles`);
            console.log(`   - Marked inactive: ${markedInactiveCount} irrelevant articles`);
            
            return {
                success: true,
                updated: updatedCount,
                markedInactive: markedInactiveCount
            };
        } catch (error) {
            console.error("Error re-categorizing articles:", error);
            throw error;
        }
    }
}

export default NewsFetcherService;