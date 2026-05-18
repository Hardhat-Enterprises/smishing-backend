import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({ message: "No authentication token, access denied" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (req.path == "/reactivate") {
            // For reactivate, allow deactivated accounts
            req.user = {
                id: user._id.toString(),
                ...decoded, // Include all decoded fields (userId, purpose, etc.)
            };
            return next();
        }

        if (!user.isActive && req.path !== "/reactivate") {
            return res.status(403).json({ message: "Account is deactivated" });
        }

        req.user = {
            id: user._id.toString(),
            ...decoded, // Include all decoded fields (userId, purpose, etc.)
        };
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is invalid" });
    }
};
