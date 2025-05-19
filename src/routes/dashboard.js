const express = require('express')
const router = express.Router()
const { getDashboardStats } = require('../controllers/dashboard.controller')
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/', authMiddleware, getDashboardStats)

module.exports = router
