import request from "supertest";
import app from "../src/app.js";

//Tests for the POST /api/reports endpoint, which handles user reports of smishing messages
describe("POST /api/reports", () => {
    it("should return 400 when messageText is missing", async () => {
        const res = await request(app).post("/api/reports").send({});

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("status", "error");
        expect(res.body).toHaveProperty("message", "messageText is required");
    });
});
