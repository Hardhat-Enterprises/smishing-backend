import request from "supertest";
import app from "../src/app.js";

describe("POST /api/auth/login", () => {
    // Test 1: No input provided
    // Ensures validation catches completely missing data
    it("should return an error when required fields are missing", async () => {
        const res = await request(app).post("/api/auth/login").send({});

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    // Test 2: Partial input (only email)
    // Ensures missing password is handled correctly
    it("should return an error when only email is provided", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: "test@example.com" });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    // Test 3: Empty values
    // Ensures empty strings are not accepted as valid input
    it("should return an error when login fields are empty", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: "", password: "" });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
});
