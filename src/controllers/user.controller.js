import User from "../models/user.model.js";

const addGuardian = async (req, res) => {
    try {
        const { guardianEmail } = req.body;
        const userId = req.user.userId;

        if (!guardianEmail) {
            return res.status(400).json({
                success: false,
                message: "Guardian email is required",
            });
        }

        console.log(guardianEmail);

        const guardian = await User.findOne({ email: guardianEmail });
        if (!guardian) {
            return res.status(404).json({
                success: false,
                message: "Guardian not found",
            });
        }

        const user = await User.findByIdAndUpdate(userId, { guardianId: guardian._id }, { new: true });

        return res.status(200).json({
            success: true,
            message: "Guardian linked successfully",
            user,
        });
    } catch (error) {
        console.error("Add guardian error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const saveFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const userId = req.user.userId;

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { fcmToken }, { new: true });

        return res.status(200).json({
            success: true,
            message: "FCM token saved successfully",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error saving FCM token:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export { addGuardian, saveFcmToken };
