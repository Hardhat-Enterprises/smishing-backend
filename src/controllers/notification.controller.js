import Notification from "../models/notification.model.js";
import admin from "../configs/firebase.config.js";

// Call this to send a notification to a guardian
export async function sendNotification(recipientId, message) {
    try {
        const notification = new Notification({
            guardianId: recipientId,
            message,
        });

        await notification.save();
        console.log("Notification sent to guardian!");
    } catch (err) {
        console.error("Failed to send notification:", err.message);
    }
}

export async function sendFCMToDevice(fcmToken, title, body) {
    try {
        const message = {
            token: fcmToken,
            notification: { title, body },
        };
        const response = await admin.messaging().send(message);
        console.log("FCM push notification sent:", response);
    } catch (err) {
        console.error("FCM push failed:", err);
    }
}

/*
 Endpoint: POST /api/notification/test-push
 Body: { token, title, body }
 Lets you verify your FCM setup via Postman.
 */
export async function testPush(req, res) {
    const { token, title, body } = req.body;
    try {
        await sendFCMToDevice(token, title, body);
        return res.json({
            success: true,
            message: "Test push sent—check server logs.",
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}

/**
Endpoint: GET /api/notification
Fetches all notifications for the logged-in guardian.
 */
export async function getNotificationsForGuardian(req, res) {
    try {
        const guardianId = req.user.userId;
        const notifications = await Notification.find({ guardianId })
            .sort({ createdAt: -1 })
            .populate("userId", "fullName email");
        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
