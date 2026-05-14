// Simple sanitization for query objects to reduce NoSQL injection risk.
export function sanitizeQueryInput(obj) {
    if (obj == null || typeof obj !== "object") return obj;

    const safe = {};
    for (const [key, value] of Object.entries(obj)) {
        // drop operator-like keys or dotted paths
        if (key.startsWith("$") || key.includes(".")) continue;
        safe[key] = typeof value === "object" && value !== null ? sanitizeQueryInput(value) : value;
    }
    return safe;
}
