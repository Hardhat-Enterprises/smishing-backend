/*import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true, // Mailtrap: STARTTLS on 2525
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// TEMP: debug env values (safe, masked). Remove later.
console.log(
    "SMTP ENV",
    { host: process.env.EMAIL_HOST, port: process.env.EMAIL_PORT },
    {
        user_end: (process.env.EMAIL_USER || "").slice(-4),
        pass_len: (process.env.EMAIL_PASS || "").length,
    },
);

transporter
    .verify()
    .then(() => console.log(" SMTP ready"))
    .catch((err) => console.error(" SMTP error:", err.message));

export async function sendEmail(to, text) {
    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject: "Your OTP",
        text,
    });
}*/

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log("SMTP ENV", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user_end: (process.env.EMAIL_USER || "").slice(-4),
    pass_len: (process.env.EMAIL_PASS || "").length,
});

transporter
    .verify()
    .then(() => console.log("SMTP ready"))
    .catch((err) => console.error("SMTP error:", err.message));

export async function sendEmail(to, text) {
    return transporter.sendMail({
        from: process.env.ALERT_FROM || process.env.EMAIL_USER,
        to,
        subject: "Your OTP",
        text,
    });
}
