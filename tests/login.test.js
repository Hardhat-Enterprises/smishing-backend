const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/index') // Adjust path to your Express app if necessary
const User = require('../src/models/user.model') // Adjust path if necessary
const { hashPassword } = require('../src/utils/token.util') // Adjust path if necessary

let server // Declare server globally to use in cleanup

describe('POST /api/auth/login', () => {
    let user

    beforeAll(async () => {
        // Create a user to test the login
        const passwordHash = await hashPassword('TestPassword123')
        user = new User({
            fullName: 'Test User',
            phoneNumber: '1234567890',
            email: 'testuser@example.com',
            passwordHash,
        })
        await user.save()

        // Start the server here (make sure to use port 3001)
        server = app.listen(3001, () => {
            console.log('Test server running on port 3001')
        })
    })

    afterAll(async () => {
        // Clean up the MongoDB connection
        await mongoose.connection.db.dropDatabase()
        await mongoose.connection.close()
    })

    it('should return 200 and login successfully', async () => {
        const response = await request(server) // Use the running server
            .post('/api/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'TestPassword123',
            })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBe('Login successful.')
        expect(response.body.token).toBeDefined() // Ensure that a token is returned
    })

    it('should return 401 for invalid credentials', async () => {
        const response = await request(server) // Use the running server
            .post('/api/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'WrongPassword',
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Invalid credentials.')
    })

    it('should return 400 if email or password is missing', async () => {
        const response = await request(server) // Use the running server
            .post('/api/auth/login')
            .send({
                email: 'testuser@example.com',
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Email and password are required.')
    })

    it('should return 401 for non-existent email', async () => {
        const response = await request(server) // Use the running server
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'TestPassword123',
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        expect(response.body.message).toBe('Invalid email.')
    })
})
