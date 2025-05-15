import User from "../models/user.model.js";
import Phishing from "../models/phishing.model.js";
import Notification from "../models/notification.model.js";
import { sendFCMToDevice } from "./notification.controller.js";

export const reportPhishing = async (req, res) => {
    try {
        //Extract data from the request
        const { messageContent } = req.body;
        const userId = req.user.userId;

        //Load the reporting user (to find their guardian)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        if (!user.guardianId) {
            return res.status(400).json({
                success: false,
                message: "No guardian linked to this user.",
            });
        }

        //Persist the Phishing report
        const phishingReport = new Phishing({ userId, messageContent });
        await phishingReport.save();
        console.log("Phishing report saved to DB");

        //Create & save a Notification document
        const notification = new Notification({
            userId,
            guardianId: user.guardianId,
            message: `Smishing detected: ${messageContent}`,
        });
        await notification.save();
        console.log("Notification saved to DB");

        //Send an FCM push to the guardian (if they have a token)
        const guardian = await User.findById(user.guardianId);
        if (guardian && guardian.fcmToken) {
            await sendFCMToDevice(guardian.fcmToken, "🚨 Smishing Alert", notification.message);
        } else {
            console.log("Guardian has no FCM token—push skipped.");
        }

        //Respond to the client
        return res.status(200).json({
            success: true,
            message: "Phishing reported. Guardian has been notified.",
        });
    } catch (error) {
        console.error("Phishing report error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while reporting phishing.",
        });
    }
};
