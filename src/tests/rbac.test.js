import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../index.js"; // Assumes app.listen is not blocking
import User from "../models/user.model.js";
import { hashPassword } from "../utils/token.util.js";

let guestToken = "";
let userToken = "";

beforeAll(async () => {
    // Connect DB if not connected already
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }

    // Login as guest
    const resGuest = await request(app).post("/api/auth/login").send({
        email: "guest@seed.com",
        password: "Password123!",
    });
    guestToken = resGuest.body.token;

    // Login as user
    const resUser = await request(app).post("/api/auth/login").send({
        email: "user@seed.com",
        password: "Password123!",
    });
    userToken = resUser.body.token;
});

describe("RBAC: /report endpoint", () => {
    it("should block guest from submitting a report", async () => {
        const res = await request(app).post("/api/report").set("Authorization", `Bearer ${guestToken}`).send({
            sender: "+61123456789",
            message: "Fake prize message!",
        });

        expect(res.status).toBe(403);
        expect(res.body.message).toContain("Access denied");
    });

    it("should allow user to submit a report", async () => {
        const res = await request(app).post("/api/report").set("Authorization", `Bearer ${userToken}`).send({
            sender: "+61123456789",
            message: "This is a test report message.",
        });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.report).toBeDefined();
    });
});
