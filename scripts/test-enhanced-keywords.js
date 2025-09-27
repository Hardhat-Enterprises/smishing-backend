#!/usr/bin/env node

/**
 * Enhanced test script to verify comprehensive cybersecurity keyword coverage
 * Run with: node scripts/test-enhanced-keywords.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import { NewsApiService, GuardianApiService } from "../src/services/newsApi.service.js";

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

async function testEnhancedKeywords() {
    try {
        log('blue', '🔍 Testing Enhanced Cybersecurity Keyword Coverage...\n');

        const newsApiService = new NewsApiService();
        const guardianApiService = new GuardianApiService();

        // Test sample articles to verify categorization
        const testArticles = [
            {
                title: "Major Ransomware Attack Hits Healthcare System",
                description: "Cybercriminals deployed sophisticated ransomware targeting hospital networks across multiple states."
            },
            {
                title: "Zero-Day Vulnerability Discovered in Popular Browser",
                description: "Security researchers identify critical exploit affecting millions of users worldwide."
            },
            {
                title: "Phishing Campaign Targets Financial Institutions",
                description: "Advanced persistent threat group launches spear-phishing attacks against major banks."
            },
            {
                title: "IoT Botnet Leverages Smart Home Devices",
                description: "Researchers discover massive botnet compromising internet of things devices for DDoS attacks."
            },
            {
                title: "Supply Chain Attack Compromises Software Updates",
                description: "Threat actors infiltrate software supply chain to distribute malicious code updates."
            },
            {
                title: "AI-Powered Threat Detection System Launched",
                description: "New artificial intelligence security solution achieves 99% malware detection accuracy."
            },
            {
                title: "Cryptocurrency Exchange Suffers Data Breach",
                description: "Major digital currency platform reports unauthorized access to customer personal information."
            },
            {
                title: "Mobile Banking Trojan Targets Android Users",
                description: "Sophisticated banking malware steals credentials from popular financial mobile applications."
            },
            {
                title: "Cloud Security Misconfiguration Exposes Sensitive Data",
                description: "Unsecured cloud storage bucket leaks millions of customer records due to access control errors."
            },
            {
                title: "Social Engineering Attack Bypasses Multi-Factor Authentication",
                description: "Cybercriminals use voice cloning technology to trick employees into revealing security credentials."
            },
            // Non-cybersecurity articles that should be filtered out\n            {\n                title: \"Football Team Wins Championship Game\",\n                description: \"Local sports team celebrates victory in annual tournament championship final.\"\n            },\n            {\n                title: \"New Restaurant Opens Downtown\",\n                description: \"Popular chef launches innovative cuisine concept featuring farm-to-table ingredients.\"\n            },\n            {\n                title: \"Weather Alert: Heavy Rain Expected\",\n                description: \"Meteorologists predict significant rainfall and potential flooding in metropolitan areas.\"\n            }\n        ];\n\n        log('yellow', '🧪 Testing Article Categorization...');\n        testArticles.forEach((article, index) => {\n            const category = newsApiService.categorizeArticle(article);\n            const tags = newsApiService.extractTags(article);\n            const isRelevant = newsApiService.isRelevantArticle(article);\n            \n            log('cyan', `\\n📰 Article ${index + 1}: ${article.title}`);\n            log('blue', `   Category: ${category}`);\n            log('blue', `   Tags: ${tags.join(', ') || 'None'}`);\n            log(isRelevant ? 'green' : 'red', `   Relevant: ${isRelevant ? 'Yes' : 'No'}`);\n        });\n\n        // Test keyword coverage\n        log('yellow', '\\n\\n🔑 Testing Keyword Coverage...');\n        log('blue', `Total cybersecurity keywords: ${newsApiService.cybersecurityKeywords.length}`);\n        \n        // Sample some keywords for verification\n        const sampleKeywords = [\n            'ransomware', 'phishing', 'zero-day', 'botnet', 'supply chain attack',\n            'artificial intelligence security', 'cryptocurrency security', 'iot security',\n            'social engineering', 'multi-factor authentication', 'penetration testing',\n            'threat intelligence', 'incident response', 'digital forensics'\n        ];\n        \n        log('magenta', '\\n🎯 Sample Keywords Coverage:');\n        sampleKeywords.forEach(keyword => {\n            const isIncluded = newsApiService.cybersecurityKeywords.some(k => \n                k.toLowerCase().includes(keyword.toLowerCase())\n            );\n            log(isIncluded ? 'green' : 'red', `   ${keyword}: ${isIncluded ? '✓' : '✗'}`);\n        });\n\n        // Test API configuration\n        log('yellow', '\\n\\n🔧 Testing API Configuration...');\n        const hasNewsApi = !!process.env.NEWS_API_KEY;\n        const hasGuardianApi = !!process.env.GUARDIAN_API_KEY;\n        \n        log(hasNewsApi ? 'green' : 'yellow', `NewsAPI Key: ${hasNewsApi ? 'Configured ✓' : 'Not configured (demo mode)'}`);\n        log(hasGuardianApi ? 'green' : 'yellow', `Guardian API Key: ${hasGuardianApi ? 'Configured ✓' : 'Not configured (demo mode)'}`);\n\n        // Test categorization statistics\n        log('yellow', '\\n\\n📊 Categorization Statistics...');\n        const categoryStats = {\n            cybersecurity: 0,\n            phishing: 0,\n            malware: 0,\n            'data-breach': 0,\n            general: 0\n        };\n        \n        const relevanceStats = {\n            relevant: 0,\n            irrelevant: 0\n        };\n        \n        testArticles.forEach(article => {\n            const category = newsApiService.categorizeArticle(article);\n            const isRelevant = newsApiService.isRelevantArticle(article);\n            \n            categoryStats[category] = (categoryStats[category] || 0) + 1;\n            relevanceStats[isRelevant ? 'relevant' : 'irrelevant']++;\n        });\n        \n        log('blue', 'Category Distribution:');\n        Object.entries(categoryStats).forEach(([category, count]) => {\n            if (count > 0) {\n                log('cyan', `   ${category}: ${count} articles`);\n            }\n        });\n        \n        log('blue', '\\nRelevance Filter:');\n        log('green', `   Relevant articles: ${relevanceStats.relevant}`);\n        log('red', `   Filtered out: ${relevanceStats.irrelevant}`);\n        \n        const accuracy = ((relevanceStats.relevant / testArticles.length) * 100).toFixed(1);\n        log('magenta', `   Relevance accuracy: ${accuracy}%`);\n\n        log('green', '\\n\\n🎉 Enhanced Keyword Testing Complete!');\n        log('blue', '\\n📋 Summary:');\n        log('blue', `   - Total keywords: ${newsApiService.cybersecurityKeywords.length}`);\n        log('blue', `   - Test articles: ${testArticles.length}`);\n        log('blue', `   - Cybersecurity articles detected: ${relevanceStats.relevant}`);\n        log('blue', `   - Non-cybersecurity articles filtered: ${relevanceStats.irrelevant}`);\n        log('blue', `   - Detection accuracy: ${accuracy}%`);\n        \n        log('cyan', '\\n🚀 Next Steps:');\n        log('cyan', '   1. Run: npm run dev');\n        log('cyan', '   2. Test: curl \"http://localhost:3000/api/news?category=cybersecurity\"');\n        log('cyan', '   3. Re-categorize existing articles: node scripts/recategorize-articles.js');\n        log('cyan', '   4. Manual fetch: curl -X POST \"http://localhost:3000/api/news/fetch\"');\n\n    } catch (error) {\n        log('red', `❌ Test failed: ${error.message}`);\n        console.error(error);\n    }\n}\n\n// Run the test\ntestEnhancedKeywords();