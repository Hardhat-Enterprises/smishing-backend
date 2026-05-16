// Validation middleware for detection retrieval endpoints
export const validateDetectionQuery = (req, res, next) => {
    const { page, limit, status } = req.query;

    if (page && isNaN(page)) {
        return res.status(400).json({ success: false, message: "Page must be a number." });
    }

    if (limit && isNaN(limit)) {
        return res.status(400).json({ success: false, message: "Limit must be a number." });
    }

    if (status && !["smishing", "spam", "safe"].includes(status)) {
        return res.status(400).json({ success: false, message: "Status must be smishing, spam or safe." });
    }

    next();
};
