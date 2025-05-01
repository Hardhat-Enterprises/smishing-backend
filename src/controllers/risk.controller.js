// src/controllers/risk.controller.js

const { analyzeMessage } = require('../utils/riskAnalyzer')
const { sendHighRiskAlertEmail } = require('../services/email.service')

/**
 * POST /api/risk
 * Expects a JSON body with a "message" property.
 * Analyzes the message and returns a risk score along with reasons.
 */
exports.analyzeRisk = async (req, res) => {
    try {
        const { message } = req.body

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'The "message" field is required.',
            })
        }

        // Analyze the message using our risk analysis function.
        const analysisResult = analyzeMessage(message)

        // Optional: If risk score is high, send an email alert.
        if (analysisResult.riskScore >= 10) {
            // Adjust the threshold as needed
            // For example, send the alert to an admin email
            sendHighRiskAlertEmail(
                'aliyansatti98@gmail.com',
                `A message scored ${analysisResult.riskScore}. Reasons: ${analysisResult.reasons.join(', ')}`
            )
                .then(() => console.log('High-risk alert email sent'))
                .catch((err) =>
                    console.error('Error sending high-risk alert email:', err)
                )
        }

        // Respond with the risk score and reasons.
        return res.status(200).json({
            success: true,
            riskScore: analysisResult.riskScore,
            reasons: analysisResult.reasons,
        })
    } catch (error) {
        console.error('Risk Analysis Error:', error)
        return res.status(500).json({
            success: false,
            message: 'Internal server error during risk analysis.',
        })
    }
}
