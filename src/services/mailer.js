import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS;
const ALERT_FROM = process.env.ALERT_FROM || SMTP_USER;

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export async function sendLoginAlert(to, { when, ip, uaLabel }) {
    const subject = "New login to your account";
    const text = `We noticed a new login to your account.

Time:   ${when.toISOString()}
IP:     ${ip}
Device: ${uaLabel}

If this wasn't you, please reset your password immediately.`;
    await transporter.sendMail({ from: ALERT_FROM, to, subject, text });
}
