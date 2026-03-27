export const errorHandler = (err, req, res, next) => {
    const timestamp = new Date().toISOString();

    // Handle specific URIError
    if (err instanceof URIError) {
        console.error(`[${timestamp}] URIError on ${req.method} ${req.originalUrl}: ${err.message}`);
        return res.status(400).json({
            success: false,
            message: "URL contains invalid characters, please try again",
        });
    }

    // General error handling
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "An unexpected error occurred, please try again later or contact customer support";

    console.error(`[${timestamp}] Error on ${req.method} ${req.originalUrl}`);
    console.error("Message:", message);
    console.error("Stack:", err.stack);

    return res.status(statusCode).json({
        success: false,
        message,
    });
};
