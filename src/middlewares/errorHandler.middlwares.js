// src/middlewares/errorHandler.js
export default function errorHandler(err, req, res, next) {
    console.error(err); // logs the full error in terminal for debugging

    // Handle invalid MongoDB ObjectId (CastError)
    if (err.name === "CastError" && err.kind === "ObjectId") {
        return res.status(400).json({
            success: false,
            message: `Invalid ID format for ${err.path}`,
        });
    }

    // Handle validation errors (like express-validator or mongoose)
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: err.errors,
        });
    }

    // Generic fallback
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Something went wrong on the server",
    });
}
