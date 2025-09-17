import { jest } from "@jest/globals";

import {
    safeDate,
    calculateAge,
    isRiskyTLD,
    hasPrivacyProtection,
    parseTxtForSPF_DMARC,
    computeRiskScore,
} from "../utils/domainHelper.js";

describe("domainHelper utils", () => {
    beforeAll(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2025-09-01T00:00:00Z"));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    test("safeDate: returns Date or null", () => {
        expect(safeDate("2025-01-02")).toBeInstanceOf(Date);
        expect(safeDate(null)).toBeNull();
        expect(safeDate(undefined)).toBeNull();
    });

    test("calculateAge: days between now and created", () => {
        const created = new Date("2025-08-15T00:00:00Z");
        expect(calculateAge(created)).toBe(17);
        expect(calculateAge(null)).toBeNull();
    });

    test("isRiskyTLD: detects risky list", () => {
        expect(isRiskyTLD("site.xyz")).toBe(true);
        expect(isRiskyTLD("site.ru")).toBe(true);
        expect(isRiskyTLD("site.com")).toBe(false);
        expect(isRiskyTLD("invalid")).toBe(false);
    });

    test("hasPrivacyProtection: flags privacy emails", () => {
        expect(hasPrivacyProtection("abc@whoisguard.com")).toBe(true);
        expect(hasPrivacyProtection("contact-PRIVACY@domain.tld")).toBe(true);
        expect(hasPrivacyProtection("owner@example.com")).toBe(false);
        expect(hasPrivacyProtection(null)).toBe(false);
    });

    test("parseTxtForSPF_DMARC: scans TXT arrays", () => {
        const txt = [
            ["v=spf1 include:_spf.google.com ~all"],
            ["some", " other", " piece"],
            ["v=DMARC1; p=reject; rua=mailto:dmarc@google.com"],
        ];
        const { hasSPF, hasDMARC } = parseTxtForSPF_DMARC(txt);
        expect(hasSPF).toBe(true);
        expect(hasDMARC).toBe(true);

        const none = parseTxtForSPF_DMARC([]);
        expect(none.hasSPF).toBe(false);
        expect(none.hasDMARC).toBe(false);
    });

    test("computeRiskScore: sums signals & caps at 100", () => {
        const score = computeRiskScore({
            ageInDays: 5,
            isRisky: true,
            hasPrivacy: true,
            registrar: "Unknown",
            domainStatus: ["clientHold"],
            dns: { hasMX: false, hasSPF: false, hasDMARC: false },
            ssl: { valid: false, expiresInDays: -1 },
            blacklist: { googleSafeBrowsing: true, phishTank: null },
        });
        expect(score).toBe(100);
    });

    test("computeRiskScore: benign case stays low", () => {
        const score = computeRiskScore({
            ageInDays: 365,
            isRisky: false,
            hasPrivacy: false,
            registrar: "Good Registrar",
            domainStatus: [],
            dns: { hasMX: true, hasSPF: true, hasDMARC: true },
            ssl: { valid: true, expiresInDays: 200 },
            blacklist: { googleSafeBrowsing: null, phishTank: null },
        });
        expect(score).toBe(0);
    });
});
