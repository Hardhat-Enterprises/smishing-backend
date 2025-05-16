import request from "supertest";
import connectDB from "../src/configs/db.config.js";
import mongoose from "mongoose";
import app from "../src/index.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";
const userId = "6825178b3ee754b9377468ee";

const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1d" });
const authHeader = `Bearer ${token}`;

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Whitelist API Tests", () => {
    it("GET /api/whitelist with token should return user whitelist", async () => {
        const res = await request(app).get("/api/whitelist/get").set("Authorization", authHeader);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("whitelist");
    });

    it("GET /api/whitelist without token should be denied", async () => {
        const res = await request(app).get("/api/whitelist/get");

        expect([401, 403]).toContain(res.statusCode);
    });

    it("POST /api/whitelist should add number", async () => {
        const res = await request(app)
            .post("/api/whitelist/add")
            .set("Authorization", authHeader)
            .send({ phoneNumber: "0412345678" });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/added/i);
    });

    it("POST /api/whitelist with invalid number should be denied", async () => {
        const res = await request(app)
            .post("/api/whitelist/add")
            .set("Authorization", authHeader)
            .send({ phoneNumber: "123" });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/invalid/i);
    });

    it("DELETE /api/whitelist should remove number", async () => {
        const res = await request(app)
            .delete("/api/whitelist/remove")
            .set("Authorization", authHeader)
            .send({ phoneNumber: "0412345678" });

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/removed/i);
    });
});
