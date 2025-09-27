#!/usr/bin/env node

/**
 * Script to re-categorize existing articles with improved logic
 * Run with: node scripts/recategorize-articles.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import NewsFetcherService from "../src/services/newsFetcher.service.js";

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

async function recategorizeArticles() {
    try {
        log('blue', '🔄 Starting article re-categorization...\n');

        // Connect to database
        log('yellow', '📊 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        log('green', '✅ Database connected\n');

        const newsFetcher = new NewsFetcherService();

        // Get current stats before re-categorization
        log('yellow', '📊 Getting current statistics...');
        const statsBefore = await newsFetcher.getNewsStats();
        log('blue', `Current articles: ${statsBefore.totalArticles}`);
        log('blue', 'Categories before:');
        statsBefore.categoriesStats.forEach(cat => {
            log('blue', `   ${cat._id}: ${cat.count} articles`);
        });
        console.log();

        // Perform re-categorization
        log('yellow', '🔄 Re-categorizing articles...');
        const result = await newsFetcher.recategorizeExistingArticles();
        
        if (result.success) {
            log('green', '✅ Re-categorization completed successfully!');
            log('blue', `   - Updated: ${result.updated} articles`);
            log('blue', `   - Marked inactive: ${result.markedInactive} irrelevant articles\n`);
        }

        // Get stats after re-categorization
        log('yellow', '📊 Getting updated statistics...');
        const statsAfter = await newsFetcher.getNewsStats();
        log('green', `Updated articles: ${statsAfter.totalArticles}`);
        log('green', 'Categories after:');
        statsAfter.categoriesStats.forEach(cat => {
            log('green', `   ${cat._id}: ${cat.count} articles`);
        });
        console.log();

        log('green', '🎉 Article re-categorization completed successfully!');
        log('blue', '\n📋 Summary:');
        log('blue', `   - Articles before: ${statsBefore.totalArticles}`);
        log('blue', `   - Articles after: ${statsAfter.totalArticles}`);
        log('blue', `   - Updated: ${result.updated}`);
        log('blue', `   - Marked inactive: ${result.markedInactive}`);

    } catch (error) {
        log('red', `❌ Re-categorization failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        log('yellow', '\n📊 Database connection closed');
    }
}

// Run the script
recategorizeArticles();