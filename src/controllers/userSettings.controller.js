const User = require('../models/user.model')

// Use a dummy user id for testing; in a real app, this would come from authentication.
const dummyUserId = '67fbc70c74c09ca84896de5f'

// GET /api/settings
exports.getUserSettings = async (req, res) => {
    try {
        // Instead of using req.user, we use the dummy user id
        const user = await User.findById(dummyUserId).select('preferences')

        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        return res.status(200).json(user.preferences)
    } catch (error) {
        console.error('Error fetching user settings:', error)
        return res.status(500).json({ error: 'Server error.' })
    }
}

// PUT /api/settings
exports.updateUserSettings = async (req, res) => {
    try {
        const { darkMode, autoDelete } = req.body

        // Retrieve the dummy user
        const user = await User.findById(dummyUserId)
        if (!user) {
            return res.status(404).json({ error: 'User not found.' })
        }

        // Update preferences if provided
        if (typeof darkMode !== 'undefined') {
            user.preferences.darkMode = darkMode
        }
        if (typeof autoDelete !== 'undefined') {
            user.preferences.autoDelete = autoDelete
        }

        // Save the updated user document
        await user.save()

        return res.status(200).json({
            success: true,
            preferences: user.preferences,
        })
    } catch (error) {
        console.error('Error updating user settings:', error)
        return res.status(500).json({ error: 'Server error.' })
    }
}
