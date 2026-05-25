// Clean incoming request data before it reaches the controller

function sanitizeText(value) {
    if (typeof value !== "string") return value;

    return value
        .trim()
        .replace(/<script.*?>.*?<\/script>/gi, "")
        .replace(/[<>]/g, "");
}

function sanitizeObject(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
        const value = obj[key];

        if (typeof value === "string") {
            sanitized[key] = sanitizeText(value);
        } else if (value && typeof value === "object") {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

export const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};
