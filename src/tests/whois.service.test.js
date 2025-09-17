import { jest } from "@jest/globals";

jest.mock("axios", () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
    },
}));

jest.mock("../utils/netHelper.js", () => ({
    __esModule: true,
    getDnsSummary: jest.fn(),
    getSslInfo: jest.fn(),
    getBlacklistSummary: jest.fn(),
}));
import axios from "axios";
import { getDnsSummary, getSslInfo, getBlacklistSummary } from "../utils/netHelper.js";
import { checkDomainReputation, checkDomainAge } from "../services/whois.service.js";

describe("whois.service", () => {
    const WHOIS_PAYLOAD = {
        WhoisRecord: {
            registryData: {
                createdDate: "2025-08-20T00:00:00Z",
                updatedDate: "2025-08-25T00:00:00Z",
                expiresDate: "2026-08-20T00:00:00Z",
                registrarName: "Test Registrar",
                nameServers: { hostNames: ["ns1.example.com", "ns2.example.com"] },
                status: ["ok"],
            },
            registrant: {
                email: "privacy@whoisguard.com",
                country: "LK",
            },
        },
    };

    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2025-09-01T00:00:00Z"));
        process.env.WHOIS_API_URL = "https://api.testwhois.local";
        process.env.WHOIS_API_KEY = "TESTKEY";
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns error for invalid domain input", async () => {
        const res = await checkDomainReputation(null);
        expect(res).toEqual({ error: "Invalid domain provided" });
    });

    test("happy path: stitches WHOIS + DNS + SSL + blacklist", async () => {
        // WHOIS
        axios.get.mockResolvedValueOnce({ data: WHOIS_PAYLOAD });

        getDnsSummary.mockResolvedValueOnce({
            a: ["1.2.3.4"],
            aaaa: [],
            mx: [{ exchange: "mx.example.com", priority: 10 }],
            txt: [["v=spf1 include:_spf.example.com ~all"], ["v=DMARC1; p=none"]],
            hasMX: true,
        });

        getSslInfo.mockResolvedValueOnce({
            available: true,
            valid: true,
            issuer: "Example CA",
            subject: "example.xyz",
            expiresOn: "2030-01-01T00:00:00.000Z",
            expiresInDays: 1500,
            selfSigned: false,
        });

        getBlacklistSummary.mockResolvedValueOnce({
            googleSafeBrowsing: null,
            phishTank: null,
        });

        const res = await checkDomainReputation("example.xyz");
        expect(axios.get).toHaveBeenCalledWith(process.env.WHOIS_API_URL, expect.any(Object));
        expect(res.domain).toBe("example.xyz");
        expect(res.registrar).toBe("Test Registrar");
        expect(res.nameServers).toEqual(["ns1.example.com", "ns2.example.com"]);
        expect(res.contactEmail).toBe("privacy@whoisguard.com");
        expect(res.ageInDays).toBe(12);
        expect(res.dnsRecords.hasMX).toBe(true);
        expect(res.dnsRecords.txtCount).toBe(2);
        expect(res.ssl.valid).toBe(true);
        expect(res.blacklist.googleSafeBrowsing).toBeNull();
        expect(typeof res.riskScore).toBe("number");
        expect(typeof res.isSuspicious).toBe("boolean");
        expect(res.isSuspicious).toBe(true);
    });

    test("propagates error as a friendly message", async () => {
        axios.get.mockRejectedValueOnce(new Error("network down"));

        const res = await checkDomainReputation("example.com");
        expect(res).toEqual({ error: "Failed to fetch WHOIS data" });
    });

    test("checkDomainAge alias points to same function", async () => {
        expect(checkDomainAge).toBe(checkDomainReputation);
    });
});
