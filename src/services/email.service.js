import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export async function sendEmail(to, subject, text) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Missing email credentials.");
        throw new Error("Email credentials are not defined in .env");
    }
    const recipientList = Array.isArray(to) ? to.join(",") : to;
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Smishing Detection Team" <${process.env.EMAIL_USER}>`,
        to: recipientList,
        subject,
        text,
    });

    console.log(`Email sent to ${to} | Subject: ${subject}`);
}
