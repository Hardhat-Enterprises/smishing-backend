import helmet from "helmet";

const securityMiddleware = helmet({
    contentSecurityPolicy: false,
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
