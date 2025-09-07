import axios from "axios";
import {
    safeDate,
    calculateAge,
    isRiskyTLD,
    hasPrivacyProtection,
    parseTxtForSPF_DMARC,
    computeRiskScore,
} from "../utils/domainHelper.js";
import { getDnsSummary, getSslInfo, getBlacklistSummary } from "../utils/netHelper.js";

export async function checkDomainReputation(domain) {
    if (!domain || typeof domain !== "string") {
        return { error: "Invalid domain provided" };
    }

    try {
        const response = await axios.get(process.env.WHOIS_API_URL, {
            params: {
                apiKey: process.env.WHOIS_API_KEY,
                domainName: domain,
                outputFormat: "JSON",
            },
            timeout: 8000,
        });

        const data = response.data?.WhoisRecord || {};
        const registryData = data.registryData || {};
        const registrant = data.registrant || {};

        const createdDate = safeDate(registryData.createdDate);
        const updatedDate = safeDate(registryData.updatedDate);
        const expiresDate = safeDate(registryData.expiresDate);

        const registrarName = registryData.registrarName || "Unknown";
        const registrarIanaId = registryData.registrarIANAID || registryData.registrarIanaId || null;
        const registrarUrl = registryData.registrarURL || registryData.registrarUrl || null;

        const nameServers = registryData.nameServers?.hostNames || [];
        const contactEmail = registrant.email || "Hidden/Unavailable";
        const registrantCountry = registrant.country || null;
        const domainStatus = Array.isArray(registryData.status)
            ? registryData.status
            : registryData.status
              ? [registryData.status]
              : [];

        const ageInDays = calculateAge(createdDate);
        const riskyTLD = isRiskyTLD(domain);
        const hasPrivacy = hasPrivacyProtection(contactEmail);

        const dns = await getDnsSummary(domain);
        const { hasSPF, hasDMARC } = parseTxtForSPF_DMARC(dns.txt);

        const sslProbe = await getSslInfo(domain);
        const ssl = sslProbe.available
            ? {
                  valid: !!sslProbe.valid,
                  issuer: sslProbe.issuer || null,
                  subject: sslProbe.subject || null,
                  expiresOn: sslProbe.expiresOn,
                  expiresInDays: sslProbe.expiresInDays,
                  selfSigned: sslProbe.selfSigned ?? null,
              }
            : { valid: null, issuer: null, subject: null, expiresOn: null, expiresInDays: null, selfSigned: null };

        const blacklist = await getBlacklistSummary(domain);

        const riskScore = computeRiskScore({
            ageInDays,
            isRisky: riskyTLD,
            hasPrivacy,
            registrar: registrarName,
            domainStatus,
            dns: { hasMX: dns.hasMX, hasSPF, hasDMARC },
            ssl,
            blacklist,
        });
        return {
            domain,

            // WHOIS core
            registrar: registrarName,
            registrarIanaId,
            registrarUrl,
            registrantCountry,
            nameServers,
            contactEmail,
            domainStatus,

            // Dates
            createdDate: createdDate?.toISOString() || "N/A",
            updatedDate: updatedDate?.toISOString() || "N/A",
            expiresDate: expiresDate?.toISOString() || "N/A",
            ageInDays,

            // DNS summary
            dnsRecords: {
                a: dns.a,
                aaaa: dns.aaaa,
                mx: dns.mx,
                txtCount: Array.isArray(dns.txt) ? dns.txt.length : 0,
                hasMX: dns.hasMX,
                hasSPF,
                hasDMARC,
            },

            ssl,
            blacklist,
            riskyTLD,
            hasPrivacy,
            riskScore,
            isSuspicious: riskScore >= 50,
        };
    } catch (error) {
        console.error("WHOIS API error:", error?.message || error);
        return { error: "Failed to fetch WHOIS data" };
    }
}

export const checkDomainAge = checkDomainReputation;
