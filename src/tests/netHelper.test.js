import { jest } from "@jest/globals";

jest.mock("dns/promises", () => ({
    __esModule: true,
    default: {},
    resolve4: jest.fn(),
    resolve6: jest.fn(),
    resolveMx: jest.fn(),
    resolveTxt: jest.fn(),
}));

jest.mock("tls", () => {
    const EventEmitter = require("events");
    const mockSocket = () => {
        const ee = new EventEmitter();
        ee.setTimeout = (ms, cb) => {
            ee._timeout = ms;
            ee._onTimeout = cb;
        };
        ee.getPeerCertificate = () => ({
            valid_to: "2030-01-01 12:00:00 GMT",
            valid_from: "2020-01-01 12:00:00 GMT",
            issuer: { O: "Example CA" },
            subject: { CN: "google.com" },
        });
        ee.end = () => {};
        ee.destroy = () => {};
        return ee;
    };

    return {
        __esModule: true,
        default: {},
        connect: jest.fn((opts, onConnect) => {
            const sock = mockSocket();
            process.nextTick(() => onConnect && onConnect());
            return sock;
        }),
    };
});

import * as dns from "dns/promises";
import tls from "tls";
import { getDnsSummary, getSslInfo, getBlacklistSummary } from "../utils/netHelper.js";

describe("netHelper", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("getDnsSummary: resolves A/AAAA/MX/TXT and flags hasMX", async () => {
        dns.resolve4.mockResolvedValueOnce(["1.2.3.4"]);
        dns.resolve6.mockResolvedValueOnce(["2001:db8::1"]);
        dns.resolveMx.mockResolvedValueOnce([{ exchange: "mx.google.com", priority: 10 }]);
        dns.resolveTxt.mockResolvedValueOnce([["v=spf1 include:_spf.google.com ~all"], ["v=DMARC1; p=none"]]);

        const res = await getDnsSummary("google.com");
        expect(res.a).toEqual(["1.2.3.4"]);
        expect(res.aaaa).toEqual(["2001:db8::1"]);
        expect(res.mx.length).toBe(1);
        expect(res.txt.length).toBe(2);
        expect(res.hasMX).toBe(true);
    });

    test("getDnsSummary: handles dns failures gracefully", async () => {
        dns.resolve4.mockRejectedValueOnce(new Error("fail v4"));
        dns.resolve6.mockRejectedValueOnce(new Error("fail v6"));
        dns.resolveMx.mockRejectedValueOnce(new Error("fail mx"));
        dns.resolveTxt.mockRejectedValueOnce(new Error("fail txt"));

        const res = await getDnsSummary("bad.example");
        expect(res.a).toEqual([]);
        expect(res.aaaa).toEqual([]);
        expect(res.mx).toEqual([]);
        expect(res.txt).toEqual([]);
        expect(res.hasMX).toBeUndefined();
    });

    test("getSslInfo: returns cert details when available", async () => {
        const res = await getSslInfo("google.com");
        expect(tls.connect).toHaveBeenCalled();
        expect(res.available).toBe(true);
        expect(res.valid).toBe(true);
        expect(res.issuer).toBe("Example CA");
        expect(res.subject).toBe("google.com");
        expect(typeof res.expiresInDays).toBe("number");
    });

    test("getBlacklistSummary: default stub", async () => {
        const res = await getBlacklistSummary("google.com");
        expect(res).toEqual({
            googleSafeBrowsing: null,
            phishTank: null,
        });
    });
});
