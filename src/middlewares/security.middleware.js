import helmet from "helmet";

const securityMiddleware = helmet({
    // OK, strong security headers: HSTS, frameguard, no-sniff, and CSP
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
        },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    frameguard: { action: "deny" },
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    },
    noSniff: true, // X-Content-Type-Options: nosniff
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
    dnsPrefetchControl: { allow: false },
});

export default securityMiddleware;
