const express = require('express')
const router = express.Router()
const { verifyPhone } = require('../controllers/verify.controller')

router.post('/', verifyPhone)

module.exports = router
