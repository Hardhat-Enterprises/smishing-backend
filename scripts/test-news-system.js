#!/usr/bin/env node

/**
 * Test script for the News API system
 * Run with: node scripts/test-news-system.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import NewsFetcherService from "../src/services/newsFetcher.service.js";
import News from "../src/models/news.model.js";

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

async function testNewsSystem() {
    try {
        log('blue', '🚀 Starting News System Test...\n');

        // Connect to database
        log('yellow', '📊 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        log('green', '✅ Database connected\n');

        const newsFetcher = new NewsFetcherService();

        // Test 1: Check API configuration
        log('yellow', '🔑 Checking API configuration...');
        const hasNewsApi = !!process.env.NEWS_API_KEY;
        const hasGuardianApi = !!process.env.GUARDIAN_API_KEY;
        
        log(hasNewsApi ? 'green' : 'red', `NewsAPI Key: ${hasNewsApi ? 'Configured' : 'Missing'}`);
        log(hasGuardianApi ? 'green' : 'red', `Guardian API Key: ${hasGuardianApi ? 'Configured' : 'Missing'}`);
        
        if (!hasNewsApi && !hasGuardianApi) {
            log('red', '❌ No API keys configured. Please add NEWS_API_KEY or GUARDIAN_API_KEY to .env');
            process.exit(1);
        }
        console.log();

        // Test 2: Check existing articles
        log('yellow', '📰 Checking existing articles...');
        const existingCount = await News.countDocuments({ isActive: true });
        log('blue', `Found ${existingCount} existing articles\n`);

        // Test 3: Fetch new articles (if API keys available)
        if (hasNewsApi || hasGuardianApi) {
            log('yellow', '🔄 Testing news fetch...');
            const result = await newsFetcher.fetchAndStoreNews();
            log('green', `✅ Fetch completed: ${result.totalStored} new articles stored`);
            
            // Show results breakdown
            if (result.results.newsapi) {
                log('blue', `  NewsAPI: ${result.results.newsapi.fetched} fetched, ${result.results.newsapi.stored} stored`);
                if (result.results.newsapi.errors.length > 0) {
                    log('red', `  NewsAPI Errors: ${result.results.newsapi.errors.join(', ')}`);
                }
            }
            
            if (result.results.guardian) {
                log('blue', `  Guardian: ${result.results.guardian.fetched} fetched, ${result.results.guardian.stored} stored`);
                if (result.results.guardian.errors.length > 0) {
                    log('red', `  Guardian Errors: ${result.results.guardian.errors.join(', ')}`);
                }
            }
            console.log();
        }

        // Test 4: Test cached news retrieval
        log('yellow', '📖 Testing cached news retrieval...');
        const cachedNews = await newsFetcher.getCachedNews({ limit: 5 });
        log('green', `✅ Retrieved ${cachedNews.articles.length} cached articles`);
        
        if (cachedNews.articles.length > 0) {
            log('blue', '  Sample articles:');
            cachedNews.articles.slice(0, 3).forEach((article, index) => {
                log('blue', `    ${index + 1}. ${article.title.substring(0, 60)}...`);
                log('blue', `       Category: ${article.category}, Source: ${article.source.name}`);
            });
        }
        console.log();

        // Test 5: Test statistics
        log('yellow', '📊 Testing statistics...');
        const stats = await newsFetcher.getNewsStats();
        log('green', `✅ Total articles: ${stats.totalArticles}`);
        log('blue', `   Last fetch: ${stats.lastFetch ? new Date(stats.lastFetch).toLocaleString() : 'Never'}`);
        
        if (stats.categoriesStats.length > 0) {
            log('blue', '   Categories:');
            stats.categoriesStats.forEach(cat => {
                log('blue', `     ${cat._id}: ${cat.count} articles`);
            });
        }
        console.log();

        // Test 6: Test filtering
        log('yellow', '🔍 Testing filtering...');
        const phishingNews = await newsFetcher.getCachedNews({ 
            category: 'phishing', 
            limit: 3 
        });
        log('green', `✅ Found ${phishingNews.articles.length} phishing articles`);

        const searchResults = await newsFetcher.getCachedNews({ 
            search: 'security', 
            limit: 3 
        });
        log('green', `✅ Found ${searchResults.articles.length} articles matching 'security'`);
        console.log();

        // Summary
        log('green', '🎉 All tests completed successfully!');
        log('blue', '\n📋 Summary:');
        log('blue', `   - Database: Connected`);
        log('blue', `   - API Keys: ${hasNewsApi ? 'NewsAPI ' : ''}${hasGuardianApi ? 'Guardian ' : ''}configured`);
        log('blue', `   - Total Articles: ${stats.totalArticles}`);
        log('blue', `   - Categories: ${stats.categoriesStats.length}`);
        log('blue', `   - System: Ready for production`);

    } catch (error) {
        log('red', `❌ Test failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        log('yellow', '\n📊 Database connection closed');
    }
}

// Run the test
testNewsSystem();