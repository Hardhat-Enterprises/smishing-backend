import User from '../models/user.model.js';
import { verifyToken } from '../utils/token.util.js';

// Simple regex to check phone number (currently adjusted for Aussie numbers)
// Acceptable numbers: +61 2 1234 5678, 02 1234 5678, +61 (2) 1234 5678, 0412 345 678
const isValidPhoneNumber = (number) => {
    const landlinePattern = /^(?:\+?(61))? ?(?:\((?=.*\)))?(0?[2-57-8])\)? ?(\d\d(?:[- ](?=\d{3})|(?!\d\d[- ]?\d[- ]))\d\d[- ]?\d[- ]?\d{3})$/;
    const mobilePattern = /^(?:\+?61|0)4\d{8}$/;
    return landlinePattern.test(number) || mobilePattern.test(number);
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token missing' });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

/**
 * GET /api/whitelist/get
 */
export const get = [
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.userId; 

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

            return res.status(200).json({
                success: true,
                whitelist: user.whitelist,
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
];

/**
 * POST /api/whitelist/add
 */
export const add = [
    authenticateToken,
    async (req, res) => {
        const { phoneNumber } = req.body;

        if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing phone number.' });
        }

        try {
            const userId = req.user.userId; 

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

            if (user.whitelist.includes(phoneNumber)) {
                return res.status(400).json({ success: false, message: 'Number already in whitelist.' });
            }

            user.whitelist.push(phoneNumber);
            await user.save();

            return res.status(200).json({ success: true, message: 'Number added to whitelist.', whitelist: user.whitelist });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
];

/**
 * DELETE /api/whitelist/remove
 */
export const remove = [
    authenticateToken,
    async (req, res) => {
        try {
            const userId = req.user.userId; 
            const { phoneNumber } = req.body;

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

            // Clear entire whitelist if 'ALL' is passed
            if (phoneNumber === 'ALL') {
                user.whitelist = [];
                await user.save();
                return res.status(200).json({ success: true, message: 'Whitelist cleared.', whitelist: user.whitelist });
            }

            const index = user.whitelist.indexOf(phoneNumber);
            if (index === -1) {
                return res.status(404).json({ success: false, message: 'Number not found in whitelist.' });
            }

            user.whitelist.splice(index, 1);
            await user.save();

            return res.status(200).json({ success: true, message: 'Number removed from whitelist.', whitelist: user.whitelist });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
    }
];
