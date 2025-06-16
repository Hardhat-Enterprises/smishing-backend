const tips = require('../data/educationTips.json')

exports.getEducationTip = (req, res) => {
    const level = req.query.level || 'beginner'
    const filteredTips = tips.filter((t) => t.level === level.toLowerCase())
    if (filteredTips.length === 0) {
        return res
            .status(404)
            .json({ message: 'No tips found for this level.' })
    }

    // Pick a random tip from the list
    const randomTip =
        filteredTips[Math.floor(Math.random() * filteredTips.length)]
    res.status(200).json(randomTip)
}
