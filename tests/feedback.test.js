import request from "supertest";
import app from "../src/app.js";

describe("POST /api/feedback", () => {
    it("should return an error when feedback data is missing", async () => {
        const res = await request(app).post("/api/feedback").send({});

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
});
