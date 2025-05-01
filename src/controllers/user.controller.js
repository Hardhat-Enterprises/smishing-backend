// src/controllers/user.controller.js

const User = require('../models/user.model')
const { hashPassword } = require('../utils/token.util')

/**
 * POST /api/users
 * Creates a new user.
 */
exports.addUser = async (req, res) => {
    try {
        const { fullName, phoneNumber, email, password } = req.body

        // Basic validation
        if (!fullName || !phoneNumber || !email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    'All fields (fullName, phoneNumber, email, password) are required.',
            })
        }

        // Check if user exists
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered.',
            })
        }

        // Hash the password before storing
        const passwordHash = await hashPassword(password)

        // Create a new user document
        const newUser = new User({
            fullName,
            phoneNumber,
            email,
            passwordHash,
        })

        // Save user to database
        await newUser.save()

        return res.status(201).json({
            success: true,
            message: 'User added successfully.',
        })
    } catch (error) {
        console.error('Error while adding user:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        })
    }
}

/**
 * GET /api/users
 * List all users.
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash') // Exclude the passwordHash
        return res.status(200).json({
            success: true,
            users,
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        })
    }
}
