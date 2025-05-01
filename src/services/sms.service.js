// src/services/sms.service.js
const twilio = require('twilio')
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

async function sendSms(to, body) {
    console.log(`🔔 Attempting to send SMS to ${to} with body: "${body}"`)
    try {
        const msg = await client.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
            body,
        })
        console.log('✅ Twilio message SID:', msg.sid)
        return msg
    } catch (err) {
        console.error('❌ Twilio sendSms error:', err)
        throw err
    }
}

module.exports = { sendSms }
