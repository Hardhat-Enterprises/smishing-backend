/**
 * POST /api/textChecker
 */
exports.checkSpamMessage = async (req, res) => {
    try {
        const { message } = req.body

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message must be provided.',
            })
        }

        // TODO: Check message against dictionary of potential spam messages
        // Just doing a dummy check for now
        const isSpam = message.toLowerCase().includes('spam')

        return res.status(200).json({
            success: true,
            message: 'Check completed successfully.',
            messageIsSpam: isSpam,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
        })
    }
}
