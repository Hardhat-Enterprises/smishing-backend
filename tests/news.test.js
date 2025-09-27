import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/index.js";
import News from "../src/models/news.model.js";
import NewsFetcherService from "../src/services/newsFetcher.service.js";

describe("News API Tests", () => {
    let server;
    const newsFetcher = new NewsFetcherService();

    beforeAll(async () => {
        // Connect to test database
        const testDbUri = process.env.MONGO_TEST_URI || "mongodb://localhost:27017/smishing_test";
        await mongoose.connect(testDbUri);
        
        // Clear test data
        await News.deleteMany({});
        
        // Insert test data
        const testArticles = [
            {
                title: "Major Phishing Attack Targets Banks",
                description: "Cybercriminals launch sophisticated phishing campaign",
                content: "Full article content about phishing attack...",
                url: "https://example.com/phishing-attack-1",
                publishedAt: new Date("2024-01-15"),
                source: { name: "CyberNews", id: "cyber-news" },
                category: "phishing",
                tags: ["phishing", "banking", "security"],
                isActive: true
            },
            {
                title: "New Malware Strain Discovered",
                description: "Security researchers identify new malware variant",
                content: "Detailed analysis of the new malware...",
                url: "https://example.com/malware-discovery-1",
                publishedAt: new Date("2024-01-14"),
                source: { name: "Security Weekly", id: "security-weekly" },
                category: "malware",
                tags: ["malware", "research", "analysis"],
                isActive: true
            }
        ];
        
        await News.insertMany(testArticles);
    });

    afterAll(async () => {
        await News.deleteMany({});
        await mongoose.connection.close();
    });

    describe("GET /api/news", () => {
        it("should return paginated news articles", async () => {
            const response = await request(app)
                .get("/api/news")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.total).toBeGreaterThan(0);
        });

        it("should filter by category", async () => {
            const response = await request(app)
                .get("/api/news?category=phishing")
                .expect(200);

            expect(response.body.success).toBe(true);
            response.body.data.forEach(article => {
                expect(article.category).toBe("phishing");
            });
        });

        it("should reject invalid category", async () => {
            const response = await request(app)
                .get("/api/news?category=general")
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain("Invalid category");
        });

        it("should search articles by title", async () => {
            const response = await request(app)
                .get("/api/news?search=phishing")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it("should limit results", async () => {
            const response = await request(app)
                .get("/api/news?limit=1")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });
    });

    describe("GET /api/news/stats", () => {
        it("should return news statistics", async () => {
            const response = await request(app)
                .get("/api/news/stats")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalArticles).toBeGreaterThan(0);
            expect(response.body.data.categoriesStats).toBeInstanceOf(Array);
        });
    });

    describe("GET /api/news/categories", () => {
        it("should return only cybersecurity categories", async () => {
            const response = await request(app)
                .get("/api/news/categories")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual(["cybersecurity", "data-breach", "malware", "phishing"]);
            expect(response.body.data).not.toContain("general");
        });
    });

    describe("POST /api/news/fetch", () => {
        it("should trigger manual news fetch", async () => {
            // This test requires API keys to be configured
            const response = await request(app)
                .post("/api/news/fetch")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    describe("NewsFetcherService", () => {
        it("should categorize articles correctly", () => {
            const phishingArticle = {
                title: "New Phishing Campaign Targets Users",
                description: "Sophisticated phishing attack discovered"
            };

            const malwareArticle = {
                title: "Dangerous Malware Spreads",
                description: "New ransomware variant detected"
            };

            // Note: These methods need to be accessible for testing
            // You might need to adjust the service structure
            expect(newsFetcher.newsApiService.categorizeArticle(phishingArticle)).toBe("phishing");
            expect(newsFetcher.newsApiService.categorizeArticle(malwareArticle)).toBe("malware");
        });

        it("should extract tags from articles", () => {
            const article = {
                title: "Phishing Attack Uses Malware",
                description: "Cybercriminals deploy ransomware in phishing campaign"
            };

            const tags = newsFetcher.newsApiService.extractTags(article);
            expect(tags).toContain("phishing");
            expect(tags).toContain("malware");
        });
    });
});