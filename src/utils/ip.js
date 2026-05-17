import ipaddr from "ipaddr.js";

export function networkBucket(ip) {
    try {
        const a = ipaddr.parse(ip);
        if (a.kind() === "ipv4") {
            const [x, y, z] = a.octets;
            return `v4:${x}.${y}.${z}`; // /24 bucket
        } else {
            const parts = a.toNormalizedString().split(":");
            return `v6:${parts.slice(0, 3).join(":")}`; // ~ /48 bucket
        }
    } catch {
        return `raw:${ip || ""}`;
    }
}

export function getClientIP(req) {
    return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "";
}
