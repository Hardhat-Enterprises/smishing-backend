import { sendEmail } from "../services/email.service.js";

/**
 * POST /api/notifications/custom
 * Sends a custom email to a single recipient.
 */
export const sendCustomEmail = async (req, res) => {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: "Email, Subject, and Message are required.",
        });
    }

    try {
        await sendEmail(email, subject, message);

        return res.status(200).json({
            success: true,
            message: "Custom email sent successfully."
        });
    } catch (error) {
        console.error("❌ Error sending custom email:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to send custom email."
        });
    }
};

/**
 * POST /api/notifications/multi
 * Sends a custom email to multiple recipients.
 */
export const sendMultiEmail = async (req, res) => {
    const { emails, subject, message } = req.body;

    if (!emails || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: "Emails, Subject, and Message are required.",
        });
    }

    // Validate that it's an array of emails
    if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Emails should be a non-empty array.",
        });
    }

    try {
        // Send the email to all recipients
        await sendEmail(emails, subject, message);

        return res.status(200).json({
            success: true,
            message: `Emails sent successfully to ${emails.length} recipients.`
        });
    } catch (error) {
        console.error("❌ Error sending emails:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to send emails."
        });
    }
};
