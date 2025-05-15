import mongoose from "mongoose";
import "dotenv/config";
import User from "../models/user.model.js";
import { hashPassword } from "../utils/token.util.js"; // Adjust path if needed

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/smishingDetection";

const seedUsers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB ✅");

        // Clear existing seeded users by email pattern
        await User.deleteMany({ email: /@seed\.com$/ });

        const roles = ["user", "guest", "admin", "qa", "dev"];
        const users = [];

        for (const role of roles) {
            const passwordHash = await hashPassword("Password123!");
            users.push({
                fullName: `${role.toUpperCase()} User`,
                phoneNumber: `+610000000${roles.indexOf(role)}`,
                email: `${role}@seed.com`,
                passwordHash,
                isEmailVerified: true,
                role,
            });
        }

        await User.insertMany(users);
        console.log(
            "✅ Seeded users:",
            users.map((u) => u.email),
        );
    } catch (err) {
        console.error("❌ Failed to seed users:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB 🚪");
        process.exit(0);
    }
};

seedUsers();
