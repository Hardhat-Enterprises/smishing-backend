import axios from "axios";
import { getDnsSummary } from "./netHelper.js";

/**
 * Heuristic "Dead End" Detection
 * Checks if a URL is active, leads to a parked domain, or has DNS issues.
 * Enhanced with redirect tracking and "cloaking" awareness.
 */
export async function checkUrlLiveness(url, brandMentions = []) {
    const result = {
        url,
        finalUrl: url,
        status: "active",
        isDeadEnd: false,
        reason: null,
        httpStatus: null,
        isParked: false,
        dnsError: false,
        isBrandMismatch: false,
        hasAtSymbolTrick: false
    };

    // 1. "@" Symbol Trick Detection (e.g. www.amazon.com@malicious.com)
    if (url.includes("@")) {
        result.hasAtSymbolTrick = true;
        result.isDeadEnd = true; // Flagged as dead-end/malicious indicator
        result.reason = "URL uses '@' symbol trick to spoof domain";
    }

    let hostname = "";
    try {
        hostname = new URL(url).hostname;
    } catch (e) {
        result.status = "invalid_url";
        result.isDeadEnd = true;
        result.reason = "Malformed URL";
        return result;
    }

    // 2. DNS Check
    const dns = await getDnsSummary(hostname);
    if (dns.error || (dns.a.length === 0 && dns.aaaa.length === 0)) {
        result.status = "dns_error";
        result.isDeadEnd = true;
        result.dnsError = true;
        result.reason = "NXDOMAIN or no A/AAAA records (common in burner campaigns)";
        return result;
    }

    // 3. HTTP HEAD/GET request with 3s timeout and redirect tracking
    try {
        const response = await axios.get(url, {
            timeout: 3000,
            maxContentLength: 10000, // Only need the head part + meta tags
            validateStatus: () => true,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SmishingDetector/1.0'
            }
        });
        
        result.httpStatus = response.status;
        result.finalUrl = response.request?.res?.responseUrl || url;
        const finalHostname = new URL(result.finalUrl).hostname;

        // 4. Brand Mismatch Check (Final Destination vs Brand Mentions)
        if (brandMentions.length > 0) {
            for (const brand of brandMentions) {
                const isOfficial = brand.officialDomains.some(domain => 
                    finalHostname === domain || finalHostname.endsWith("." + domain)
                );
                if (!isOfficial) {
                    result.isBrandMismatch = true;
                    // If it redirects away from a brand's known domain to something else, it's highly suspicious
                    if (url.toLowerCase().includes(brand.name.toLowerCase()) || 
                        brand.officialDomains.some(d => url.includes(d))) {
                        result.isDeadEnd = true;
                        result.reason = `Redirected to unofficial domain: ${finalHostname}`;
                    }
                }
            }
        }

        if (response.status >= 400) {
            result.status = "inactive";
            result.isDeadEnd = true;
            result.reason = `HTTP ${response.status} Error`;
        }

        // 5. Meta-tag detector for "Parked Domain" signatures
        const html = String(response.data).toLowerCase();
        const parkedKeywords = [
            "domain for sale", "buy this domain", "parked free", 
            "this domain is parked", "domain is available", "under construction",
            "coming soon", "placeholder page", "domain expired", "domain name for sale",
            "domain industry", "domain authority", "domain flipping"
        ];

        if (parkedKeywords.some(kw => html.includes(kw))) {
            result.isParked = true;
            result.isDeadEnd = true;
            result.reason = "Parked Domain signature detected";
            result.status = "parked";
        }
    } catch (err) {
        result.status = "error";
        result.isDeadEnd = true;
        result.reason = err.code === 'ECONNABORTED' ? "Request Timeout (3s)" : err.message;
    }

    return result;
}
