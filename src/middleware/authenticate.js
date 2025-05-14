import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
    console.log("Incoming request to protected route");

    const authHeader = req.headers["authorization"];
    console.log("🧾 Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log(" No or invalid Authorization header");
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    console.log(" Extracted Token:", token);

    try {
        const secret = process.env.JWT_SECRET;
        console.log(" JWT_SECRET:", secret);

        const decoded = jwt.verify(token, secret);
        console.log(" Token verified. Payload:", decoded);

        req.user = decoded;
        next();
    } catch (err) {
        console.error(" JWT verification failed:", err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default authenticate;
