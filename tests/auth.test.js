import request from "supertest";
import app from "../src/app.js";

describe("POST /api/auth/login", () => {
    it("should return error for missing fields", async () => {
        const res = await request(app).post("/api/auth/login").send({});

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
});
