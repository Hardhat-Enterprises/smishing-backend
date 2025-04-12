const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'mysecret'

async function hashPassword(password) {
    const saltRounds = 10
    return bcrypt.hash(password, saltRounds)
}

async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash)
}

async function hashOtp(otp) {
    const saltRounds = 10
    return bcrypt.hash(otp, saltRounds)
}

async function compareOtp(otp, hash) {
    return bcrypt.compare(otp, hash)
}

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
}

module.exports = {
    hashPassword,
    comparePassword,
    hashOtp,
    compareOtp,
    generateToken,
}
