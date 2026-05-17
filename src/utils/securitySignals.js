import { UAParser } from "ua-parser-js";
import { networkBucket } from "./ip.js";

export function isNewIPOrDevice(user, ip, ua) {
    const lastNet = networkBucket(user?.security?.lastLoginIP || "");
    const currNet = networkBucket(ip || "");
    const newIP = lastNet && currNet && lastNet !== currNet;

    const prevUA = user?.security?.lastLoginUA || "";
    const newUA = prevUA !== ua;

    return { changed: newIP || newUA, newIP, newUA };
}
export function userAgentLabel(ua) {
    const p = new UAParser(ua || "").getResult();
    const b = p.browser?.name || "Browser";
    const v = p.browser?.version?.split(".")[0] || "";
    const os = p.os?.name || "OS";
    return `${b}${v ? " " + v : ""} on ${os}`;
}
