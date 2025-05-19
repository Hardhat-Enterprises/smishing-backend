const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const jwt = require('jsonwebtoken');

// Mock token and user ID
const userId = '6614d4a541c20e26b4030a84';
const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'mysecret');


beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/smishing_test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('GET /api/dashboard', () => {
  it('should return dashboard stats JSON', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalScans');
    expect(res.body).toHaveProperty('smishingCount');
    expect(res.body).toHaveProperty('lastScanAt');
  });
});
