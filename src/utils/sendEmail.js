const nodemailer = require('nodemailer')

module.exports = async (to, text) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Gmail SMTP server
        port: 465, // Use port 465 for SSL
        secure: true, // Set to true for SSL (false for TLS on port 587)
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail address
            pass: process.env.EMAIL_PASS, // App Password generated from Gmail
        },
    })

    await transporter.sendMail({
        from: process.env.EMAIL_USER, // Sender's email address
        to: to, // Recipient's email address
        subject: 'OTP Verification',
        text: text, // OTP message
    })
}
