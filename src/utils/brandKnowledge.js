/**
 * Brand Knowledge Base
 * Maps major brands to their official sender IDs, Short-codes, and official domains.
 * Updated with 2025/2026 data.
 */

export const BRAND_KNOWLEDGE_BASE = [
    {
        name: "Amazon",
        identifiers: [/amazon/i, /amzn/i],
        officialSenders: ["Amazon", "AMZN", "262966", "22580"],
        officialDomains: ["amazon.com", "amazon.co.uk", "amzn.to", "amazon.in"]
    },
    {
        name: "Apple",
        identifiers: [/apple/i, /icloud/i, /itunes/i],
        officialSenders: ["Apple", "50472"],
        officialDomains: ["apple.com", "icloud.com"]
    },
    {
        name: "Microsoft",
        identifiers: [/microsoft/i, /msft/i, /outlook/i, /hotmail/i, /office365/i, /365/i],
        officialSenders: ["Microsoft", "MSFT", "732873"],
        officialDomains: ["microsoft.com", "live.com", "outlook.com", "office.com"]
    },
    {
        name: "Google",
        identifiers: [/google/i, /gogle/i, /gmail/i],
        officialSenders: ["Google", "22000", "244444"],
        officialDomains: ["google.com", "gmail.com"]
    },
    {
        name: "Netflix",
        identifiers: [/netflix/i, /nflx/i],
        officialSenders: ["Netflix", "NFLX"],
        officialDomains: ["netflix.com"]
    },
    {
        name: "Chase",
        identifiers: [/chase/i, /jp\s*morgan/i],
        officialSenders: ["Chase", "24273"],
        officialDomains: ["chase.com"]
    },
    {
        name: "PayPal",
        identifiers: [/paypal/i, /pypl/i],
        officialSenders: ["PayPal", "729725"],
        officialDomains: ["paypal.com"]
    },
    {
        name: "USPS",
        identifiers: [/usps/i, /post\s*office/i, /postal/i],
        officialSenders: ["USPS", "28777"],
        officialDomains: ["usps.com"]
    },
    {
        name: "FedEx",
        identifiers: [/fedex/i],
        officialSenders: ["FedEx", "46333"],
        officialDomains: ["fedex.com"]
    },
    {
        name: "UPS",
        identifiers: [/ups/i],
        officialSenders: ["UPS", "69877"],
        officialDomains: ["ups.com"]
    },
    {
        name: "HMRC",
        identifiers: [/hmrc/i, /revenue\s*&\s*customs/i],
        officialSenders: ["HMRC"],
        officialDomains: ["gov.uk"]
    },
    {
        name: "IRS",
        identifiers: [/irs/i, /internal\s*revenue/i],
        officialSenders: ["IRS"],
        officialDomains: ["irs.gov"]
    },
    {
        name: "Facebook",
        identifiers: [/facebook/i, /meta/i, /fb\.me/i],
        officialSenders: ["Facebook", "Meta", "32665"],
        officialDomains: ["facebook.com", "fb.me"]
    },
    {
        name: "Roblox",
        identifiers: [/roblox/i],
        officialSenders: ["Roblox"],
        officialDomains: ["roblox.com"]
    },
    {
        name: "Steam",
        identifiers: [/steam/i, /valve/i],
        officialSenders: ["Steam"],
        officialDomains: ["steampowered.com", "steamcommunity.com"]
    }
];

/**
 * Extracts brand mentions from text.
 */
export const extractBrandMentions = (text = "") => {
    const mentions = [];
    for (const brand of BRAND_KNOWLEDGE_BASE) {
        if (brand.identifiers.some(regex => regex.test(text))) {
            mentions.push(brand);
        }
    }
    return mentions;
};
