const express = require('express')
const router = express.Router()
const { getEducationTip } = require('../controllers/educationController')

router.get('/', getEducationTip)

module.exports = router
