const Detection = require('../models/detection.model')

const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id

        const totalScans = await Detection.countDocuments({ user: userId })
        const smishingCount = await Detection.countDocuments({
            user: userId,
            prediction: 'smishing'
        })
        const latest = await Detection.findOne({ user: userId })
            .sort({ createdAt: -1 })
            .select('createdAt')

        res.json({
            totalScans,
            smishingCount,
            lastScanAt: latest?.createdAt || null
        })
    } catch (error) {
        console.error('Dashboard error:', error)
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = { getDashboardStats }
