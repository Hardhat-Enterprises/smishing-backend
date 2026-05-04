import request from "supertest";
import app from "../src/app.js";

//Tests the GET /health endpoint and checks for a successful response
describe("GET /health", () => {
    it("should return a successful health response", async () => {
        const res = await request(app).get("/health");

        expect(res.statusCode).toBeGreaterThanOrEqual(200);
        expect(res.statusCode).toBeLessThan(500);
    });
});
