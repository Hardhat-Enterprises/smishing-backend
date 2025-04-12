const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/index')
const User = require('../src/models/user.model')

let server

describe('POST /api/auth/signup', () => {
    beforeAll(async () => {
        server = app.listen(3002) // Use another port to avoid conflict
    })

    afterAll(async () => {
        await mongoose.connection.db.dropDatabase()
        await mongoose.connection.close()
        server.close()
    })

    it('should register a new user successfully', async () => {
        const response = await request(server).post('/api/auth/signup').send({
            fullName: 'Signup User',
            phoneNumber: '9876543210',
            email: 'signupuser@example.com',
            password: 'StrongPass123',
        })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('User registered successfully.')
    })

    it('should return 400 if fields are missing', async () => {
        const response = await request(server).post('/api/auth/signup').send({
            email: 'incomplete@example.com',
            password: 'NoFullNameOrPhone',
        })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toMatch(/All fields/)
    })

    it('should return 409 if email already exists', async () => {
        // Reuse the user from the successful test
        const response = await request(server).post('/api/auth/signup').send({
            fullName: 'Duplicate User',
            phoneNumber: '1231231234',
            email: 'signupuser@example.com', // same email as before
            password: 'AnotherPass123',
        })

        expect(response.status).toBe(409)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Email already registered.')
    })
})
