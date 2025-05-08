import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import Report from "../models/report.model.js";
import User from "../models/user.model.js";
import app from "../index.js";

let token = "";
let userEmail = "reporttest@example.com";
let password = "TestPassword123";

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: "smishingDetection",
    });

    // 1. Sign up a new user
    await request(app).post("/api/auth/signup").send({
        fullName: "Vitest Report Tester",
        phoneNumber: "+61123456789",
        email: userEmail,
        password: password,
    });

    // 2. Manually verify the user in DB
    const user = await User.findOne({ email: userEmail });
    user.isEmailVerified = true;
    await user.save();

    // 3. Login to get JWT token
    const res = await request(app).post("/api/auth/login").send({
        email: userEmail,
        password: password,
    });

    token = res.body.token;
});

afterAll(async () => {
    await Report.deleteMany({ sender: "+61499999999" });
    await User.deleteOne({ email: userEmail });
    await mongoose.connection.close();
});

describe("POST /api/report", () => {
    it("should submit a valid report", async () => {
        const res = await request(app).post("/api/report").set("Authorization", `Bearer ${token}`).send({
            sender: "+61499999999",
            message: "This is a test smishing message from signup",
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.report).toHaveProperty("sender");
        expect(res.body.report).toHaveProperty("message");
    });

    it("should reject if sender or message is missing", async () => {
        const res = await request(app).post("/api/report").set("Authorization", `Bearer ${token}`).send({
            message: "Missing sender field",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it("should reject if token is missing", async () => {
        const res = await request(app).post("/api/report").send({
            sender: "+61499998888",
            message: "Attempt without token",
        });

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
