// import request from "supertest";
// import app from "../src/index.js"; 
// import connectDB from "../src/configs/db.config.js";
// import mongoose from "mongoose";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = "myjwtdevsecret123";
// const token = jwt.sign({ id: "1234567890" }, JWT_SECRET, { expiresIn: "1h" });

// beforeAll(async () => {
//   await connectDB();
// });

// afterAll(async () => {
//   await mongoose.connection.close(); 
// });

// describe("GET /dashboard", () => {
//   it(" should return 200 with expected fields", async () => {
//     const res = await request(app)
//       .get("/dashboard")
//       .set("Authorization", `Bearer ${token}`);

//     expect(res.statusCode).toBe(200);
//     expect(res.body).toHaveProperty("totalScans");
//     expect(res.body).toHaveProperty("smishingCount");
//     expect(res.body).toHaveProperty("lastScanAt");
//   });

//   it(" should return 401 without token", async () => {
//     const res = await request(app).get("/dashboard");
//     expect(res.statusCode).toBe(401);
//   });
// });
import { jest } from '@jest/globals';
import request from "supertest";
import app from "../src/index.js";
import connectDB from "../src/configs/db.config.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Detection from "../src/models/detection.model.js";


const JWT_SECRET = "myjwtdevsecret123";
const validToken = jwt.sign({ id: "1234567890" }, JWT_SECRET, { expiresIn: "1h" });
const expiredToken = jwt.sign({ id: "1234567890" }, JWT_SECRET, { expiresIn: "-10s" });

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("GET /dashboard - JWT Auth & Response Validation", () => {
  it(" returns 200 with valid token and correct response fields", async () => {
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${validToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalScans");
    expect(res.body).toHaveProperty("smishingCount");
    expect(res.body).toHaveProperty("lastScanAt");
  });

  it(" returns 401 when token is missing", async () => {
    const res = await request(app).get("/dashboard");
    expect(res.statusCode).toBe(401);
  });

  it(" returns 401 when token is invalid", async () => {
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 with no token", async () => {
  const res = await request(app).get("/dashboard");
  expect(res.statusCode).toBe(401);
  expect(res.body.message || res.text).toMatch(/unauthorized/i);
});


  it("returns 0 scans if no data exists for user", async () => {
    const token = jwt.sign({ id: "nonexistentUser" }, JWT_SECRET, { expiresIn: "1h" });
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.totalScans).toBe(0);
    expect(res.body.smishingCount).toBe(0);
    expect(res.body.lastScanAt === null || res.body.lastScanAt === undefined).toBe(true);
  });

  it("lastScanAt is null if no scan exists", async () => {
    const token = jwt.sign({ id: "noScanUser" }, JWT_SECRET, { expiresIn: "1h" });
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.lastScanAt).toBeNull();
  });
  it(" ensures totalScans is a number", async () => {
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${validToken}`);
    expect(typeof res.body.totalScans).toBe("number");
  });

  it(" ensures smishingCount is a number", async () => {
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${validToken}`);
    expect(typeof res.body.smishingCount).toBe("number");
  });

  it(" ensures lastScanAt is either string or null", async () => {
    const res = await request(app)
      .get("/dashboard")
      .set("Authorization", `Bearer ${validToken}`);
    expect(
      typeof res.body.lastScanAt === "string" || res.body.lastScanAt === null
    ).toBeTruthy();
  });

  it(" handles server errors gracefully", async () => {
  // Backup original
  const originalAggregate = Detection.aggregate;

  // Force aggregate to throw an error
  Detection.aggregate = jest.fn(() => {
    throw new Error("Forced error");
  });

  const res = await request(app)
    .get("/dashboard")
    .set("Authorization", `Bearer ${validToken}`);

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error");

  // Restore original
  Detection.aggregate = originalAggregate;
});

});

