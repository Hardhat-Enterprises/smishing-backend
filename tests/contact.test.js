import request from "supertest";
import app from "../src/app.js";

//Tests for the POST /api/contact endpoint, which handles contact form submissions
describe("POST /api/contact", () => {
    it("should return an error when required fields are missing", async () => {
        const res = await request(app).post("/api/contact").send({});

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it("should return an error when only email is provided", async () => {
        const res = await request(app).post("/api/contact").send({ email: "test@example.com" });

        expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });
});
