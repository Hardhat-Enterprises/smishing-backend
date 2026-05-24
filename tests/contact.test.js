import request from "supertest";
import app from "../src/app.js";

describe("POST /api/contact", () => {
    it("should reject requests without authentication", async () => {
        const res = await request(app).post("/api/contact").send({});

        expect(res.statusCode).toBeGreaterThanOrEqual(400);

        expect(res.body).toHaveProperty("message", "No authentication token, access denied");
    });
});
