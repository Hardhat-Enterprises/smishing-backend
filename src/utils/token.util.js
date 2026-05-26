import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set in .env");
}

export async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function generateAccessToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            tokenVersion: user.tokenVersion || 0,
        },
        JWT_SECRET,
        { expiresIn: "15m" },
    );
}

export function generateRefreshToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            tokenVersion: user.tokenVersion || 0,
        },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
    );
}

export function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}
