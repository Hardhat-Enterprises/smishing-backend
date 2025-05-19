const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecret';

async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

// AuthenticateToken Added:
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user; // Attach user info to request object
        next();
    });
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    authenticateToken,
};
