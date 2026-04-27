import request from "supertest";
import { jest } from "@jest/globals";
import { setupAxiosMock, mockPost } from "./mocks/axios.mock.js";
import { setupEmailMock } from "./mocks/email.mock.js";

// Mock axios BEFORE importing app
// This prevents real calls to the ML service
setupAxiosMock();
setupEmailMock();

jest.unstable_mockModule("axios", () => ({
    default: { post: mockPost },
}));

// Import app after mocking (important for ESM)
const { default: app } = await import("../src/app.js");

describe("POST /api/scan", () => {
    // Reset mock before each test to avoid interference
    beforeEach(() => {
        mockPost.mockReset();
    });

    // Test 1: Missing message field
    // To ensure input validation works correctly
    it("should return 422 when message is missing", async () => {
        const res = await request(app).post("/api/scan").send({});

        expect(res.statusCode).toBe(422);
        expect(res.body).toHaveProperty("detail", "Message is required");
    });

    // Test 2: Empty message string
    // To ensure empty input is treated as invalid
    it("should return 422 when message is an empty string", async () => {
        const res = await request(app).post("/api/scan").send({ message: "" });

        expect(res.statusCode).toBe(422);
        expect(res.body).toHaveProperty("detail", "Message is required");
    });

    // Test 3: Happy path (valid message)
    // Simulate ML service returning a valid prediction
    it("should return prediction and confidence for a valid message", async () => {
        mockPost.mockResolvedValue({
            data: {
                prediction: "smishing",
                confidence: 0.95,
            },
        });

        const res = await request(app).post("/api/scan").send({ message: "Click this urgent link now" });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("prediction", "smishing");
        expect(res.body).toHaveProperty("confidence", 0.95);
    });

    // Test 4: Very long message
    // To ensure system handles large payloads without crashing
    it("should handle a very long message", async () => {
        mockPost.mockResolvedValue({
            data: {
                prediction: "spam",
                confidence: 0.88,
            },
        });

        const longMessage = "urgent ".repeat(1000);

        const res = await request(app).post("/api/scan").send({ message: longMessage });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("prediction", "spam");
        expect(res.body).toHaveProperty("confidence", 0.88);
    });

    // Test 5: ML service failure
    // To ensure backend handles external service errors safely
    it("should return 500 if the ML service fails", async () => {
        mockPost.mockRejectedValue(new Error("ML service unavailable"));

        const res = await request(app).post("/api/scan").send({ message: "Click this urgent link now" });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty("detail", "Failed to get prediction from ML microservice");
    });

    // Test 6: ML timeout simulation
    it("should return 500 if the ML service times out", async () => {
        mockPost.mockRejectedValue(new Error("timeout"));

        const res = await request(app).post("/api/scan").send({ message: "Please verify your account immediately" });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty("detail", "Failed to get prediction from ML microservice");
    });

    // Test 7: Invalid ML response
    it("should handle invalid ML response safely", async () => {
        mockPost.mockResolvedValue({
            data: null,
        });

        const res = await request(app).post("/api/scan").send({ message: "Click this link now" });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty("detail", "Failed to get prediction from ML microservice");
    });
});
