import axios from "axios";

export async function checkDomainAge(domain) {
    try {
        const response = await axios.get(process.env.WHOIS_API_URL, {
            params: {
                apiKey: process.env.WHOIS_API_KEY,
                domainName: domain,
                outputFormat: "JSON",
            },
        });

        const data = response.data;
        const createdDate = new Date(data.RegistryData?.createdDate || data.WhoisRecord?.registryData?.createdDate);

        if (!createdDate) {
            return { error: "Domain creation date not found" };
        }

        const today = new Date();
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            domain,
            createdDate: createdDate.toISOString(),
            ageInDays: diffDays,
            isSuspicious: diffDays < 30,
        };
    } catch (error) {
        console.error("WHOIS API error:", error.message);
        return { error: "Failed to fetch domain age" };
    }
}
