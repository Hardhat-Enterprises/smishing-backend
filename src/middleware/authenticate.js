import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.userId }; // ✅ THIS is what your consent route expects
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token." });
    }
};

export default authenticate;
