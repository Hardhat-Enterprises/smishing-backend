import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

export async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export async function hashOtp(otp) {
    const saltRounds = 10;
    return bcrypt.hash(otp, saltRounds);
}

export async function compareOtp(otp, hash) {
    return bcrypt.compare(otp, hash);
}

export function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}
