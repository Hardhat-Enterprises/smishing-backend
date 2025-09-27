import News from "../models/news.model.js";

/**
 * NewsAPI.org service for fetching cybersecurity news
 * Free tier: 1000 requests/month, 100 requests/day
 */
class NewsApiService {
    constructor() {
        this.baseUrl = "https://newsapi.org/v2";
        this.apiKey = process.env.NEWS_API_KEY;
        this.cybersecurityKeywords = [
            // Core cybersecurity terms
            "cybersecurity", "cyber security", "information security", "infosec", "cybersec",
            "network security", "computer security", "digital security", "IT security",
            "enterprise security", "cloud security", "application security", "web security",
            
            // Attacks and threats
            "cyber attack", "cyberattack", "cyber threat", "cyber warfare", "cyber crime", "cybercrime",
            "hacking", "hacker", "black hat", "white hat", "grey hat", "ethical hacking",
            "penetration testing", "pen test", "red team", "blue team", "purple team",
            "social engineering", "insider threat", "advanced persistent threat", "apt",
            "supply chain attack", "zero trust", "threat hunting", "threat intelligence",
            
            // Data breaches and leaks
            "data breach", "data leak", "security breach", "privacy breach", "information leak",
            "database breach", "personal data breach", "customer data breach", "GDPR breach",
            "healthcare data breach", "financial data breach", "corporate espionage",
            
            // Malware categories
            "malware", "ransomware", "trojan", "virus", "worm", "spyware", "adware",
            "rootkit", "botnet", "backdoor", "keylogger", "rat", "remote access trojan",
            "cryptominer", "cryptojacking", "fileless malware", "polymorphic malware",
            "banking trojan", "mobile malware", "android malware", "ios malware",
            
            // Phishing and fraud
            "phishing", "smishing", "vishing", "spear phishing", "whaling", "business email compromise",
            "bec", "email fraud", "romance scam", "tech support scam", "invoice fraud",
            "ceo fraud", "identity theft", "account takeover", "credential stuffing",
            "sim swapping", "voice cloning", "deepfake", "synthetic identity",
            
            // Vulnerabilities and exploits
            "vulnerability", "exploit", "zero-day", "cve", "security flaw", "security hole",
            "buffer overflow", "sql injection", "cross-site scripting", "xss", "csrf",
            "remote code execution", "rce", "privilege escalation", "path traversal",
            "deserialization", "xxe", "ssrf", "idor", "directory traversal",
            
            // DDoS and network attacks
            "ddos", "denial of service", "distributed denial of service", "amplification attack",
            "botnet attack", "syn flood", "udp flood", "icmp flood", "slowloris",
            "man in the middle", "mitm", "dns poisoning", "arp spoofing", "packet sniffing",
            
            // Authentication and access
            "authentication", "authorization", "access control", "multi-factor authentication",
            "mfa", "two-factor authentication", "2fa", "single sign-on", "sso",
            "password security", "password breach", "credential theft", "brute force",
            "dictionary attack", "password spraying", "session hijacking",
            
            // Encryption and cryptography
            "encryption", "decryption", "cryptography", "ssl", "tls", "https",
            "public key infrastructure", "pki", "digital certificate", "certificate authority",
            "end-to-end encryption", "quantum cryptography", "post-quantum cryptography",
            "hash function", "digital signature", "blockchain security",
            
            // Security tools and technologies
            "firewall", "antivirus", "anti-malware", "endpoint protection", "edr",
            "extended detection and response", "xdr", "siem", "soar", "ids", "ips",
            "intrusion detection", "intrusion prevention", "web application firewall", "waf",
            "vpn", "virtual private network", "proxy", "tor", "anonymization",
            
            // Compliance and regulations
            "gdpr", "hipaa", "pci dss", "sox", "compliance", "data protection",
            "privacy law", "cyber law", "data governance", "risk management",
            "security audit", "security assessment", "vulnerability assessment",
            "security framework", "nist", "iso 27001", "cis controls",
            
            // Incident response and forensics
            "incident response", "security incident", "cyber incident", "digital forensics",
            "computer forensics", "malware analysis", "threat analysis", "security operations",
            "soc", "security operations center", "csirt", "cert", "breach notification",
            
            // Emerging technologies and threats
            "iot security", "internet of things security", "smart device security",
            "industrial control systems", "ics", "scada", "operational technology", "ot",
            "cloud security", "container security", "kubernetes security", "devops security",
            "devsecops", "api security", "microservices security", "serverless security",
            "artificial intelligence security", "ai security", "machine learning security",
            "5g security", "edge computing security", "quantum computing threat",
            
            // Financial and cryptocurrency
            "cryptocurrency security", "crypto security", "blockchain attack",
            "smart contract vulnerability", "defi hack", "crypto theft", "exchange hack",
            "fintech security", "payment security", "mobile banking security",
            
            // Mobile and application security
            "mobile security", "app security", "application security", "secure coding",
            "code review", "static analysis", "dynamic analysis", "penetration test",
            "bug bounty", "responsible disclosure", "security research"
        ];
    }

    /**
     * Fetch cybersecurity news from NewsAPI
     * Optimized to fetch ONLY cybersecurity-related articles
     */
    async fetchCyberNews(pageSize = 50) {
        if (!this.apiKey) {
            throw new Error("NEWS_API_KEY not configured");
        }

        try {
            // Use high-impact cybersecurity keywords only - no general terms
            const cyberKeywords = [
                "cybersecurity", "cyber security", "cyber attack", "cyberattack",
                "data breach", "security breach", "hacking", "malware", 
                "ransomware", "phishing", "smishing", "vulnerability",
                "exploit", "zero-day", "trojan", "botnet", "APT",
                "identity theft", "social engineering", "penetration testing"
            ];
            
            // Create focused query for cybersecurity only
            let query = cyberKeywords.join(" OR ");
            let baseUrl = `${this.baseUrl}/everything?sortBy=publishedAt&pageSize=${pageSize}&language=en&apiKey=${this.apiKey}&q=`;
            let fullUrl = baseUrl + encodeURIComponent(query);
            
            // If URL is too long, split into multiple smaller queries
            if (fullUrl.length > 500) {
                console.log('📏 Query too long, splitting into smaller requests...');
                return await this.fetchWithMultipleQueries(cyberKeywords, pageSize);
            }
            
            console.log(`🔍 NewsAPI Cybersecurity Query length: ${fullUrl.length} characters`);
            console.log(`🔍 Query: ${query}`);
            
            const response = await fetch(fullUrl, {
                headers: {
                    'X-API-Key': this.apiKey
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`NewsAPI Error Response: ${response.status} ${response.statusText}`);
                console.error(`Response body: ${errorText}`);
                throw new Error(`NewsAPI error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            
            if (data.status === 'error') {
                console.error(`NewsAPI API Error: ${data.code} - ${data.message}`);
                throw new Error(`NewsAPI API error: ${data.message}`);
            }
            
            // Filter results to ensure only cybersecurity articles
            const filteredArticles = (data.articles || []).filter(article => 
                this.isRelevantArticle(article)
            );
            
            console.log(`📰 NewsAPI returned ${data.articles?.length || 0} total articles`);
            console.log(`🔒 Filtered to ${filteredArticles.length} cybersecurity articles`);
            return filteredArticles;
        } catch (error) {
            console.error("Error fetching from NewsAPI:", error);
            throw error;
        }
    }

    /**
     * Fetch news using multiple smaller queries when main query is too long
     */
    async fetchWithMultipleQueries(keywords, pageSize) {
        const allArticles = [];
        const maxKeywordsPerQuery = 8; // Safe number to stay under 500 chars
        const requestsPerMinute = 20; // NewsAPI rate limit consideration
        
        // Split keywords into chunks
        for (let i = 0; i < keywords.length; i += maxKeywordsPerQuery) {
            const keywordChunk = keywords.slice(i, i + maxKeywordsPerQuery);
            const query = keywordChunk.join(" OR ");
            
            try {
                const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${Math.ceil(pageSize / Math.ceil(keywords.length / maxKeywordsPerQuery))}&language=en`;
                
                console.log(`🔍 Batch ${Math.floor(i / maxKeywordsPerQuery) + 1} Query length: ${url.length} characters`);
                console.log(`🔍 Batch query: ${query}`);
                
                const response = await fetch(url, {
                    headers: {
                        'X-API-Key': this.apiKey
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'ok' && data.articles) {
                        allArticles.push(...data.articles);
                        console.log(`📰 Batch ${Math.floor(i / maxKeywordsPerQuery) + 1} returned ${data.articles.length} articles`);
                    }
                } else {
                    const errorText = await response.text();
                    console.warn(`⚠️ Batch ${Math.floor(i / maxKeywordsPerQuery) + 1} failed: ${response.status} - ${errorText}`);
                }
                
                // Add delay between requests to respect rate limits
                if (i + maxKeywordsPerQuery < keywords.length) {
                    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
                }
            } catch (error) {
                console.warn(`⚠️ Batch ${Math.floor(i / maxKeywordsPerQuery) + 1} error:`, error.message);
            }
        }
        
        // Remove duplicates based on URL
        const uniqueArticles = allArticles.filter((article, index, self) => 
            index === self.findIndex(a => a.url === article.url)
        );
        
        console.log(`📰 Total unique articles from ${Math.ceil(keywords.length / maxKeywordsPerQuery)} batches: ${uniqueArticles.length}`);
        return uniqueArticles.slice(0, pageSize); // Limit to requested page size
    }

    /**
     * Process and categorize cybersecurity news articles
     * Only returns cybersecurity-related categories - no "general" category
     * Enhanced to prevent cooking/lifestyle articles from being categorized as cyber
     */
    categorizeArticle(article) {
        const title = (article.title || "").toLowerCase();
        const description = (article.description || "").toLowerCase();
        const content = title + " " + description;

        // FIRST: Check if this is clearly NOT a cybersecurity article
        const definiteNonCyberContexts = [
            "cookout", "steak", "grilling", "kitchen", "food prep", "recipe",
            "culinary", "chef", "restaurant", "meal prep", "cooking tips",
            "game score", "tournament winner", "season stats", "playoffs",
            "movie premiere", "celebrity gossip", "fashion week", "beauty tips"
        ];
        
        const hasDefiniteNonCyberContext = definiteNonCyberContexts.some(keyword => 
            content.includes(keyword)
        );
        
        if (hasDefiniteNonCyberContext) {
            // Even if it has non-cyber context, check for very strong cybersecurity indicators
            const veryStrongCyberIndicators = [
                "cyber-attack", "cyber attack", "cyberattack", "data breach", "security breach",
                "cybersecurity incident", "hacking incident", "malware attack"
            ];
            
            const hasVeryStrongCyberIndicators = veryStrongCyberIndicators.some(indicator =>
                content.includes(indicator)
            );
            
            // If no very strong cyber indicators, this shouldn't be categorized as cybersecurity
            if (!hasVeryStrongCyberIndicators) {
                return "non-cybersecurity"; // This will be rejected by our storage logic
            }
        }

        // Check for phishing and social engineering (highest priority)
        const phishingKeywords = [
            "phishing", "smishing", "vishing", "spear phishing", "whaling",
            "business email compromise", "bec", "email fraud", "romance scam",
            "tech support scam", "invoice fraud", "ceo fraud", "social engineering",
            "credential theft", "account takeover", "sim swapping", "voice cloning",
            "deepfake", "synthetic identity", "identity theft", "credential stuffing"
        ];
        if (phishingKeywords.some(keyword => content.includes(keyword))) {
            return "phishing";
        }

        // Check for malware and malicious software
        const malwareKeywords = [
            "malware", "ransomware", "trojan", "virus", "worm", "spyware", "adware",
            "rootkit", "botnet", "backdoor", "keylogger", "rat", "remote access trojan",
            "cryptominer", "cryptojacking", "fileless malware", "polymorphic malware",
            "banking trojan", "mobile malware", "android malware", "ios malware",
            "supply chain attack", "malware analysis", "malicious code", "payload",
            "dropper", "loader", "stealer", "infostealer"
        ];
        if (malwareKeywords.some(keyword => content.includes(keyword))) {
            return "malware";
        }

        // Check for data breaches and leaks
        const breachKeywords = [
            "data breach", "data leak", "security breach", "privacy breach",
            "information leak", "database breach", "personal data breach",
            "customer data breach", "gdpr breach", "healthcare data breach",
            "financial data breach", "corporate espionage", "breach notification",
            "exposed database", "unsecured database", "leaked data", "stolen data",
            "data exposure", "sensitive data leak", "pii breach", "credit card breach"
        ];
        if (breachKeywords.some(keyword => content.includes(keyword))) {
            return "data-breach";
        }
        
        // Default to general cybersecurity for any remaining cyber content
        return "cybersecurity";
    }

    /**
     * Extract relevant tags from article content
     */
    extractTags(article) {
        const content = `${article.title || ""} ${article.description || ""}`.toLowerCase();
        const tags = [];
        
        const tagKeywords = [
            // Attack types
            "phishing", "smishing", "vishing", "spear-phishing", "whaling",
            "ransomware", "malware", "trojan", "virus", "worm", "spyware", "adware",
            "rootkit", "botnet", "backdoor", "keylogger", "cryptojacking",
            "ddos", "sql-injection", "xss", "csrf", "zero-day", "apt",
            
            // Security concepts
            "cybersecurity", "infosec", "cyber", "security", "hacking", "hacker",
            "vulnerability", "exploit", "breach", "attack", "threat", "incident",
            "penetration-testing", "ethical-hacking", "red-team", "blue-team",
            "threat-hunting", "threat-intelligence", "insider-threat",
            
            // Technologies and tools
            "firewall", "antivirus", "encryption", "vpn", "ssl", "tls",
            "authentication", "mfa", "2fa", "sso", "pki", "certificate",
            "endpoint-protection", "edr", "xdr", "siem", "soar", "ids", "ips",
            "waf", "sandbox", "honeypot", "deception-technology",
            
            // Data and privacy
            "data-breach", "data-leak", "privacy", "gdpr", "hipaa", "pci-dss",
            "data-protection", "personal-data", "sensitive-data", "pii",
            "data-loss-prevention", "dlp", "data-governance",
            
            // Compliance and frameworks
            "compliance", "audit", "assessment", "framework", "nist", "iso-27001",
            "cis-controls", "risk-management", "governance", "policy",
            
            // Incident response and forensics
            "incident-response", "forensics", "digital-forensics", "malware-analysis",
            "threat-analysis", "security-operations", "soc", "csirt", "cert",
            
            // Emerging technologies
            "iot-security", "cloud-security", "container-security", "kubernetes",
            "devops", "devsecops", "api-security", "microservices", "serverless",
            "ai-security", "ml-security", "quantum-security", "5g-security",
            "edge-computing", "scada", "iot", "industrial-security",
            
            // Financial and crypto
            "fintech", "cryptocurrency", "blockchain", "bitcoin", "defi",
            "smart-contract", "crypto-wallet", "exchange", "payment-security",
            
            // Mobile and application
            "mobile-security", "app-security", "android", "ios", "secure-coding",
            "code-review", "static-analysis", "dynamic-analysis", "owasp",
            "bug-bounty", "responsible-disclosure", "security-research",
            
            // Network security
            "network-security", "perimeter-security", "zero-trust", "segmentation",
            "access-control", "identity-management", "privileged-access", "pam",
            
            // Business and organizational
            "security-awareness", "training", "phishing-simulation", "tabletop-exercise",
            "business-continuity", "disaster-recovery", "crisis-management",
            "third-party-risk", "vendor-risk", "supply-chain"
        ];

        tagKeywords.forEach(keyword => {
            if (content.includes(keyword.replace("-", " ")) || content.includes(keyword)) {
                tags.push(keyword.replace("-", "-"));
            }
        });

        // Remove duplicates and return
        return [...new Set(tags)];
    }

    /**
     * Check if article is relevant to cybersecurity
     * Strict filtering to ensure ONLY cybersecurity articles are included
     */
    isRelevantArticle(article) {
        const title = (article.title || "").toLowerCase();
        const description = (article.description || "").toLowerCase();
        const content = title + " " + description;
        
        // STRICT EXCLUSION: Filter out clearly non-cybersecurity content first
        const strongExcludeKeywords = [
            // Food and cooking (even if they mention "hack")
            "cookout", "steak", "grilling", "kitchen", "food prep",
            "culinary", "chef", "restaurant", "dining", "meal", "ingredient",
            "flavor", "taste", "delicious", "seasoning", "marinade", "recipe",
            
            // Sports and entertainment  
            "game score", "tournament winner", "season stats", "playoff",
            "movie premiere", "celebrity news", "entertainment tonight",
            "box office", "grammy awards", "oscar winner", "album release",
            
            // Lifestyle and fashion
            "fashion week", "beauty tips", "makeup tutorial", "skincare routine",
            "home decor", "gardening tips", "travel destination", "vacation",
            
            // Weather and local news
            "weather forecast", "rainfall", "sunny skies", "temperature today",
            "traffic report", "road closure", "local events", "community news"
        ];
        
        // Check for obvious non-cyber content
        const hasStrongExcludes = strongExcludeKeywords.some(keyword => 
            content.includes(keyword)
        );
        
        if (hasStrongExcludes) {
            // For articles with exclude keywords, require VERY strong cybersecurity evidence
            const emergencyCyberKeywords = [
                "cyber attack", "cyberattack", "data breach", "security breach",
                "hacking incident", "malware attack", "ransomware", "phishing campaign",
                "vulnerability disclosed", "security incident", "cyber threat",
                "information security", "cybersecurity", "network security"
            ];
            
            const hasEmergencyCyberContext = emergencyCyberKeywords.some(keyword =>
                content.includes(keyword)
            );
            
            // Reject if no emergency cyber context found
            if (!hasEmergencyCyberContext) {
                return false;
            }
        }
        
        // Must contain at least one strong cybersecurity keyword
        const requiredCyberKeywords = [
            // Core cybersecurity terms (including hyphenated versions)
            "cybersecurity", "cyber security", "cyber-security",
            "cyber attack", "cyberattack", "cyber-attack",
            "information security", "infosec", "network security", "cyber threat", "cyber-threat",
            
            // Specific attack types and incidents
            "data breach", "data-breach", "security breach", "breach notification", "data leak", "data-leak",
            "hacking", "hacker", "hackers", "security incident", "cyber incident", "cyber-incident",
            "malware", "ransomware", "phishing", "trojan", "botnet",
            "ddos", "denial of service", "man in the middle",
            
            // Security violations and compromises  
            "unauthorized access", "security compromise", "system compromise",
            "credential theft", "identity theft", "account takeover",
            "security vulnerability", "vulnerability", "exploit", "zero-day", "zero day",
            
            // Security technologies and responses
            "penetration test", "security audit", "incident response",
            "threat intelligence", "security operations", "digital forensics"
        ];
        
        const hasRequiredKeywords = requiredCyberKeywords.some(keyword =>
            content.includes(keyword)
        );
        
        return hasRequiredKeywords;
    }
}

/**
 * Guardian API service (alternative/backup)
 * Free tier: 12 calls per second, 5000 calls per day
 */
class GuardianApiService {
    constructor() {
        this.baseUrl = "https://content.guardianapis.com";
        this.apiKey = process.env.GUARDIAN_API_KEY;
    }

    async fetchCyberNews(pageSize = 50) {
        if (!this.apiKey) {
            throw new Error("GUARDIAN_API_KEY not configured");
        }

        try {
            // Use focused cybersecurity search terms for Guardian API
            const searchTerms = [
                "cybersecurity", "cyber security", "cyber attack", "cyberattack",
                "data breach", "security breach", "hacking", "malware",
                "ransomware", "phishing", "vulnerability", "exploit",
                "identity theft", "social engineering", "botnet", "trojan"
            ];
            
            // Create a manageable query that fits within URL limits
            const query = searchTerms.join(" OR ");
            const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page-size=${pageSize}&api-key=${this.apiKey}&show-fields=body,thumbnail`;
            
            console.log(`🔍 Guardian Cybersecurity Query length: ${url.length} characters`);
            console.log(`🔍 Guardian Query: ${query}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Guardian API Error Response: ${response.status} ${response.statusText}`);
                console.error(`Response body: ${errorText}`);
                throw new Error(`Guardian API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.response?.status === 'error') {
                console.error(`Guardian API Error: ${data.response.message}`);
                throw new Error(`Guardian API error: ${data.response.message}`);
            }
            
            // Transform Guardian format to NewsAPI-like format
            const articles = (data.response?.results || []).map(article => ({
                title: article.webTitle,
                description: article.fields?.body?.substring(0, 200) + "..." || "",
                content: article.fields?.body || "",
                url: article.webUrl,
                urlToImage: article.fields?.thumbnail || null,
                publishedAt: article.webPublicationDate,
                source: {
                    name: "The Guardian",
                    id: "the-guardian"
                },
                author: null
            }));
            
            // Create a temporary NewsAPI service instance for filtering
            const newsApiService = new NewsApiService();
            const filteredArticles = articles.filter(article => 
                newsApiService.isRelevantArticle(article)
            );
            
            console.log(`📰 Guardian returned ${articles.length} total articles`);
            console.log(`🔒 Filtered to ${filteredArticles.length} cybersecurity articles`);
            return filteredArticles;
        } catch (error) {
            console.error("Error fetching from Guardian API:", error);
            throw error;
        }
    }
}

export { NewsApiService, GuardianApiService };