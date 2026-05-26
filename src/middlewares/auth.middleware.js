import User from "../models/user.model.js";
import { verifyAccessToken } from "../utils/token.util.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No authentication token, access denied",
            });
        }

        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.userId).select("+tokenVersion");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const currentTokenVersion = user.tokenVersion || 0;
        const tokenVersionFromJwt = decoded.tokenVersion || 0;

        if (tokenVersionFromJwt !== currentTokenVersion) {
            return res.status(401).json({
                success: false,
                message: "Token is invalid. Please log in again.",
            });
        }

        if (req.path === "/reactivate") {
            req.user = { id: user._id.toString() };
            return next();
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated",
            });
        }

        req.user = { id: user._id.toString() };
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token is invalid or expired",
        });
    }
};
