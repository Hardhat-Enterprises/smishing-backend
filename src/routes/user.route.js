// src/routes/user.route.js

const express = require('express')
const router = express.Router()
const userController = require('../controllers/user.controller')

// Route to add a new user
router.post('/', userController.addUser)

// Route to list all users (for testing/admin purposes)
router.get('/', userController.getAllUsers)

module.exports = router
