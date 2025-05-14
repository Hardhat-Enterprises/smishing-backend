const cron = require('node-cron')
const nodemailer = require('nodemailer')
const tips = require('../data/educationTips.json')

// Replace with actual user emails (or fetch from DB)
const userEmails = ['user1@example.com', 'user2@example.com']

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
    },
})

const sendDailyTip = () => {
    const beginnerTips = tips.filter((t) => t.level === 'beginner')
    const randomTip =
        beginnerTips[Math.floor(Math.random() * beginnerTips.length)]

    const mailOptions = {
        from: process.env.EMAIL_ID,
        to: userEmails,
        subject: 'Smishing Tip of the Day',
        text: randomTip.tip,
    }

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error('Failed to send daily tip:', err)
        else console.log('Daily tip sent:', info.response)
    })
}

// Run at 10:00 AM every day
cron.schedule('0 10 * * *', sendDailyTip)
