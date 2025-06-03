// generateToken.js
import jwt from "jsonwebtoken";

// ✅ Your actual secret
const JWT_SECRET = "myjwtdevsecret123";

const token = jwt.sign(
    { id: "1234567890" }, // payload
    JWT_SECRET, // secret
    { expiresIn: "1h" }, // token expiry
);

console.log("🔐 JWT Token:\n", token);
