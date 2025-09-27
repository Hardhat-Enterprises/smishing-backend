import NewsFetcherService from "../services/newsFetcher.service.js";

class NewsScheduler {
    constructor() {
        this.newsFetcher = new NewsFetcherService();
        this.intervalId = null;
        this.isRunning = false;
    }

    /**
     * Start automatic news fetching
     * @param {number} intervalHours - Hours between fetches (default: 6 hours)
     */
    start(intervalHours = 6) {
        if (this.isRunning) {
            console.log("📰 News scheduler is already running");
            return;
        }

        const intervalMs = intervalHours * 60 * 60 * 1000; // Convert to milliseconds
        
        console.log(`📰 Starting news scheduler - fetching every ${intervalHours} hours`);
        
        // Fetch immediately on start
        this.fetchNews();
        
        // Set up recurring fetch
        this.intervalId = setInterval(() => {
            this.fetchNews();
        }, intervalMs);
        
        this.isRunning = true;
    }

    /**
     * Stop automatic news fetching
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log("📰 News scheduler stopped");
    }

    /**
     * Execute news fetch with error handling
     */
    async fetchNews() {
        try {
            console.log("📰 Scheduled news fetch starting...");
            const result = await this.newsFetcher.fetchAndStoreNews();
            console.log(`📰 Scheduled fetch completed: ${result.totalStored} articles stored`);
        } catch (error) {
            console.error("📰 Scheduled news fetch failed:", error.message);
        }
    }

    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            intervalId: this.intervalId !== null
        };
    }
}

// Export singleton instance
const newsScheduler = new NewsScheduler();
export default newsScheduler;