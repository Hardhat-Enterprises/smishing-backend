import request from "supertest";
import app from "../src/app.js";

describe("POST /api/scan", () => {
    it("should return 422 when message is missing", async () => {
        const res = await request(app).post("/api/scan").send({});

        expect(res.statusCode).toBe(422);
        expect(res.body).toHaveProperty("detail", "Message is required");
    });
});
