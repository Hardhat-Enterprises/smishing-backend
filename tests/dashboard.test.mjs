import request from "supertest";
import app from "../src/index.js"; 
import connectDB from "../src/configs/db.config.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const JWT_SECRET = "myjwtdevsecret123";
const token = jwt.sign({ id: "1234567890" }, JWT_SECRET, { expiresIn: "1h" });

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close(); // ✅ clean up Mongo connection
});

describe("GET /dashboard", () => {
  it("✅ should return 200 with expected fields", async () => {
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalScans");
    expect(res.body).toHaveProperty("smishingCount");
    expect(res.body).toHaveProperty("lastScanAt");
  });

  it("❌ should return 401 without token", async () => {
    const res = await request(app).get("/dashboard");
    expect(res.statusCode).toBe(401);
  });
});
