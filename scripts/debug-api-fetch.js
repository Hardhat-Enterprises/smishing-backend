#!/usr/bin/env node

/**
 * Debug script to test API fetching without storing to database
 * Run with: node scripts/debug-api-fetch.js
 */

import "dotenv/config";
import { NewsApiService, GuardianApiService } from "../src/services/newsApi.service.js";

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

async function debugApiFetch() {
    try {
        log('blue', '🔍 Debug: Testing API Fetch Operations...\n');

        const newsApiService = new NewsApiService();
        const guardianApiService = new GuardianApiService();

        // Check API key configuration
        log('yellow', '🔑 Checking API Configuration...');
        const hasNewsApi = !!process.env.NEWS_API_KEY;
        const hasGuardianApi = !!process.env.GUARDIAN_API_KEY;
        
        log(hasNewsApi ? 'green' : 'red', `NewsAPI Key: ${hasNewsApi ? 'Configured ✓' : 'Missing ✗'}`);
        log(hasGuardianApi ? 'green' : 'red', `Guardian API Key: ${hasGuardianApi ? 'Configured ✓' : 'Missing ✗'}`);
        console.log();

        // Test NewsAPI
        if (hasNewsApi) {
            log('yellow', '📰 Testing NewsAPI...');
            try {
                const articles = await newsApiService.fetchCyberNews(5); // Small batch for testing
                log('green', `✅ NewsAPI Success: Retrieved ${articles.length} articles`);
                
                if (articles.length > 0) {
                    log('blue', 'Sample article:');
                    log('blue', `   Title: ${articles[0].title}`);
                    log('blue', `   Source: ${articles[0].source?.name}`);
                    log('blue', `   Published: ${articles[0].publishedAt}`);
                }
            } catch (error) {
                log('red', `❌ NewsAPI Error: ${error.message}`);
                if (error.message.includes('400')) {
                    log('yellow', '💡 Hint: This might be due to query length or invalid parameters');
                }
                if (error.message.includes('401')) {
                    log('yellow', '💡 Hint: Check your NEWS_API_KEY in .env file');
                }
                if (error.message.includes('429')) {
                    log('yellow', '💡 Hint: Rate limit exceeded - try again later');
                }
            }
        } else {
            log('yellow', '⚠️  NewsAPI key not configured - skipping test');
        }

        console.log();

        // Test Guardian API
        if (hasGuardianApi) {
            log('yellow', '📰 Testing Guardian API...');
            try {
                const articles = await guardianApiService.fetchCyberNews(5); // Small batch for testing
                log('green', `✅ Guardian Success: Retrieved ${articles.length} articles`);
                
                if (articles.length > 0) {
                    log('blue', 'Sample article:');
                    log('blue', `   Title: ${articles[0].title}`);
                    log('blue', `   Source: ${articles[0].source?.name}`);
                    log('blue', `   Published: ${articles[0].publishedAt}`);
                }
            } catch (error) {
                log('red', `❌ Guardian API Error: ${error.message}`);
                if (error.message.includes('400')) {
                    log('yellow', '💡 Hint: Invalid query parameters');
                }
                if (error.message.includes('401')) {
                    log('yellow', '💡 Hint: Check your GUARDIAN_API_KEY in .env file');
                }
                if (error.message.includes('403')) {
                    log('yellow', '💡 Hint: API key may not have required permissions');
                }
            }
        } else {
            log('yellow', '⚠️  Guardian API key not configured - skipping test');
        }

        console.log();
        log('blue', '🏁 Debug test completed!');
        
        if (!hasNewsApi && !hasGuardianApi) {
            log('yellow', '\n💡 To test with real APIs, add these to your .env file:');
            log('yellow', '   NEWS_API_KEY=your_key_from_newsapi.org');
            log('yellow', '   GUARDIAN_API_KEY=your_key_from_theguardian.com');
        }

    } catch (error) {
        log('red', `❌ Debug test failed: ${error.message}`);
        console.error(error);
    }
}

// Run the debug test
debugApiFetch();