#!/usr/bin/env node

/**
 * Demo data seeder for testing the News API without external API keys
 * Run with: node scripts/seed-demo-news.js
 */

import "dotenv/config";
import mongoose from "mongoose";
import News from "../src/models/news.model.js";

const demoArticles = [
    {
        title: "Major Banking Phishing Campaign Targets Mobile Users",
        description: "Cybercriminals launch sophisticated SMS phishing attacks targeting major bank customers across multiple countries.",
        content: "Security researchers have identified a large-scale phishing campaign specifically targeting mobile banking users through SMS messages. The attack uses convincing replicas of legitimate banking websites and sophisticated social engineering techniques to steal credentials and financial information.",
        url: "https://example.com/banking-phishing-campaign-2024",
        urlToImage: "https://example.com/images/phishing-attack.jpg",
        publishedAt: new Date("2024-01-15T10:30:00Z"),
        source: {
            name: "CyberSecurity Today",
            id: "cybersecurity-today"
        },
        author: "Sarah Johnson",
        category: "phishing",
        tags: ["phishing", "smishing", "banking", "mobile", "fraud"],
        isActive: true
    },
    {
        title: "New Ransomware Strain 'CryptoLocker 2024' Spreads Rapidly",
        description: "A new variant of ransomware has been detected, showing advanced evasion techniques and targeting enterprise networks.",
        content: "Cybersecurity firms report a new ransomware strain that has infected over 500 organizations worldwide. The malware uses advanced encryption and anti-analysis techniques, making it particularly dangerous for enterprise environments.",
        url: "https://example.com/cryptolocker-2024-ransomware",
        urlToImage: "https://example.com/images/ransomware-alert.jpg",
        publishedAt: new Date("2024-01-14T14:20:00Z"),
        source: {
            name: "Malware Research Lab",
            id: "malware-research-lab"
        },
        author: "Dr. Michael Chen",
        category: "malware",
        tags: ["ransomware", "malware", "enterprise", "encryption", "cybercrime"],
        isActive: true
    },
    {
        title: "Healthcare Data Breach Exposes 2.3 Million Patient Records",
        description: "Major healthcare provider suffers massive data breach affecting millions of patients' personal and medical information.",
        content: "A leading healthcare network has disclosed a significant data breach that compromised personal health information of 2.3 million patients. The breach included names, addresses, social security numbers, and detailed medical records.",
        url: "https://example.com/healthcare-data-breach-2024",
        urlToImage: "https://example.com/images/data-breach.jpg",
        publishedAt: new Date("2024-01-13T09:15:00Z"),
        source: {
            name: "Healthcare Security News",
            id: "healthcare-security-news"
        },
        author: "Jennifer Martinez",
        category: "data-breach",
        tags: ["data-breach", "healthcare", "privacy", "personal-data", "hipaa"],
        isActive: true
    },
    {
        title: "AI-Powered Cybersecurity Tools Show 95% Threat Detection Rate",
        description: "New artificial intelligence systems demonstrate unprecedented accuracy in detecting and preventing cyber threats.",
        content: "Recent studies show that AI-powered cybersecurity solutions are achieving remarkable success rates in threat detection. These systems use machine learning algorithms to identify patterns and anomalies that traditional security tools might miss.",
        url: "https://example.com/ai-cybersecurity-breakthrough",
        urlToImage: "https://example.com/images/ai-security.jpg",
        publishedAt: new Date("2024-01-12T16:45:00Z"),
        source: {
            name: "Tech Security Weekly",
            id: "tech-security-weekly"
        },
        author: "Alex Thompson",
        category: "cybersecurity",
        tags: ["artificial-intelligence", "machine-learning", "threat-detection", "innovation"],
        isActive: true
    },
    {
        title: "Government Agencies Issue Warning About SMS Phishing Surge",
        description: "Federal cybersecurity agencies report 300% increase in SMS-based phishing attacks targeting citizens.",
        content: "Multiple government cybersecurity agencies have issued joint warnings about a dramatic increase in SMS phishing attacks. These 'smishing' campaigns are becoming increasingly sophisticated and are targeting citizens with fake government messages.",
        url: "https://example.com/government-smishing-warning",
        urlToImage: "https://example.com/images/government-warning.jpg",
        publishedAt: new Date("2024-01-11T11:30:00Z"),
        source: {
            name: "Government Cyber Alert",
            id: "government-cyber-alert"
        },
        author: "Official Statement",
        category: "phishing",
        tags: ["smishing", "government", "warning", "sms", "public-safety"],
        isActive: true
    },
    {
        title: "Zero-Day Vulnerability Discovered in Popular Email Client",
        description: "Security researchers identify critical vulnerability affecting millions of email users worldwide.",
        content: "A critical zero-day vulnerability has been discovered in a widely-used email client, potentially affecting millions of users. The vulnerability could allow attackers to execute arbitrary code and gain unauthorized access to systems.",
        url: "https://example.com/email-client-zero-day",
        urlToImage: "https://example.com/images/vulnerability.jpg",
        publishedAt: new Date("2024-01-10T13:20:00Z"),
        source: {
            name: "Vulnerability Research Center",
            id: "vulnerability-research-center"
        },
        author: "Security Team",
        category: "cybersecurity",
        tags: ["zero-day", "vulnerability", "email", "security-patch", "critical"],
        isActive: true
    },
    {
        title: "Cryptocurrency Exchange Loses $50M in Sophisticated Hack",
        description: "Major cryptocurrency platform suffers significant losses due to advanced persistent threat attack.",
        content: "A prominent cryptocurrency exchange has reported a major security breach resulting in the theft of approximately $50 million in various digital currencies. The attack appears to have been carried out by a sophisticated threat actor group.",
        url: "https://example.com/crypto-exchange-hack-50m",
        urlToImage: "https://example.com/images/crypto-hack.jpg",
        publishedAt: new Date("2024-01-09T08:45:00Z"),
        source: {
            name: "Crypto Security Report",
            id: "crypto-security-report"
        },
        author: "Financial Crime Unit",
        category: "data-breach",
        tags: ["cryptocurrency", "hack", "financial-crime", "blockchain", "theft"],
        isActive: true
    },
    {
        title: "New Mobile Malware Targets Banking Apps on Android Devices",
        description: "Researchers discover sophisticated Android malware specifically designed to steal banking credentials.",
        content: "Cybersecurity experts have identified a new strain of Android malware that specifically targets mobile banking applications. The malware uses advanced techniques to bypass security measures and steal user credentials.",
        url: "https://example.com/android-banking-malware",
        urlToImage: "https://example.com/images/mobile-malware.jpg",
        publishedAt: new Date("2024-01-08T15:10:00Z"),
        source: {
            name: "Mobile Security Labs",
            id: "mobile-security-labs"
        },
        author: "Research Team",
        category: "malware",
        tags: ["android", "mobile-malware", "banking", "credentials", "trojan"],
        isActive: true
    }
];

async function seedDemoNews() {
    try {
        console.log('🌱 Starting demo news seeding...\n');

        // Connect to database
        console.log('📊 Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Database connected\n');

        // Clear existing demo data (optional)
        console.log('🧹 Clearing existing demo data...');
        await News.deleteMany({ 
            url: { $regex: /^https:\/\/example\.com/ } 
        });
        console.log('✅ Existing demo data cleared\n');

        // Insert demo articles
        console.log('📰 Inserting demo articles...');
        const insertedArticles = await News.insertMany(demoArticles);
        console.log(`✅ Successfully inserted ${insertedArticles.length} demo articles\n`);

        // Show summary
        console.log('📊 Demo Data Summary:');
        const stats = await News.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} articles`);
        });

        const totalCount = await News.countDocuments({ isActive: true });
        console.log(`   Total: ${totalCount} articles\n`);

        console.log('🎉 Demo data seeding completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('   1. Start your server: npm run dev');
        console.log('   2. Test the API: curl http://localhost:3000/api/news');
        console.log('   3. Import Postman collection for full testing');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📊 Database connection closed');
    }
}

// Run the seeder
seedDemoNews();