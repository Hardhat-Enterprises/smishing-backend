const Guardian = require('../models/guardian.model')

exports.saveGuardian = async (req, res) => {
    try {
        const { userId, name, contactType, contactValue } = req.body

        if (!userId || !name || !contactType || !contactValue) {
            return res.status(400).json({ error: 'All fields are required.' })
        }

        const guardian = new Guardian({
            userId,
            name,
            contactType,
            contactValue,
        })
        await guardian.save()

        return res
            .status(201)
            .json({ message: 'Guardian saved successfully', guardian })
    } catch (error) {
        return res.status(500).json({ error: 'Server error' })
    }
}
