import request from "supertest";
import { jest } from "@jest/globals";

// mock axios BEFORE importing app
const mockPost = jest.fn();

jest.unstable_mockModule("axios", () => ({
    default: { post: mockPost },
}));

const { default: app } = await import("../src/app.js");

describe("POST /api/scan", () => {
    it("should return 422 when message is missing", async () => {
        const res = await request(app).post("/api/scan").send({});

        expect(res.statusCode).toBe(422);
    });

    it("should return prediction and confidence for valid message", async () => {
        mockPost.mockResolvedValue({
            data: {
                prediction: "smishing",
                confidence: 0.95,
            },
        });

        const res = await request(app).post("/api/scan").send({ message: "Click this urgent link now" });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("prediction");
        expect(res.body).toHaveProperty("confidence");
    });
});
