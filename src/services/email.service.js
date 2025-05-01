// src/services/email.service.js

const nodemailer = require('nodemailer')

// Create a transporter using the configuration from your .env file
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT), // Convert port to a Number
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

/**
 * Send an email with the given options.
 *
 * @param {Object} mailOptions - Options for the email to send.
 */
async function sendEmail(mailOptions) {
    try {
        const info = await transporter.sendMail(mailOptions)
        console.log('Email sent:', info.response)
        return info
    } catch (error) {
        console.error('Error sending email:', error)
        throw error
    }
}

/**
 * Send a welcome email to a new user.
 *
 * @param {string} to - The recipient's email address.
 * @param {string} name - The recipient's name.
 */
async function sendWelcomeEmail(to, name) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: 'Welcome to Smishing Detection!',
        text: `Hi ${name},\n\nWelcome to Smishing Detection. We're excited to have you on board! Enjoy our services and stay safe.\n\nBest regards,\nThe Smishing Detection Team`,
        html: `
      <h1>Hi ${name},</h1>
      <p>Welcome to <strong>Smishing Detection</strong>. We're excited to have you on board!</p>
      <p>Enjoy our services and stay safe.</p>
      <br/>
      <p>Best regards,<br/>The Smishing Detection Team</p>
    `,
    }

    return sendEmail(mailOptions)
}

/**
 * (Optional) Send a high-risk detection alert email.
 *
 * @param {string} to - The recipient's email address (for admin or user alert).
 * @param {string} messageDetails - A description of the high-risk analysis.
 */
async function sendHighRiskAlertEmail(to, messageDetails) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: 'High-Risk Message Detected',
        text: `Alert!\n\nA high-risk message has been detected:\n\n${messageDetails}\n\nPlease review immediately.`,
        html: `
      <h1>High-Risk Message Detected</h1>
      <p>${messageDetails}</p>
      <p>Please review immediately.</p>
    `,
    }

    return sendEmail(mailOptions)
}

module.exports = { sendWelcomeEmail, sendHighRiskAlertEmail }
