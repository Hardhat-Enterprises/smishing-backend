const express = require('express')
const router = express.Router()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    service: 'gmail',
    auth: {
        user: 'harshthadeshwar123@gmail.com',
        pass: 'idlbbvuhcyotsmet',
    },
})

router.post('/notify-guardian', async (req, res) => {
    const {
        user_name,
        guardian_name,
        guardian_email,
        message,
        detection_result,
    } = req.body

    if (detection_result !== 'smishing') {
        return res
            .status(400)
            .json({ message: 'Not a smishing message. No alert sent.' })
    }

    const mailOptions = {
        from: '"Smishing Detector Alert" <harshthadeshwar123@gmail.com>',
        to: guardian_email,
        subject: `⚠️ ALERT: ${user_name} may have received a smishing message`,
        text: `Hi ${guardian_name},\n\n${user_name} just received a suspicious message:\n\n"${message}"\n\nPlease check on them.\n\n— Smishing Alert System`,
    }

    try {
        await transporter.sendMail(mailOptions)
        res.json({ status: 'success', message: 'Guardian has been notified.' })
    } catch (error) {
        console.error('Email sending failed:', error)
        res.status(500).json({
            status: 'error',
            message: 'Failed to notify guardian.',
        })
    }
})

module.exports = router
