import User from "../models/user.model.js";

// GET /me
export const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
};

// PUT /update
export const updateProfile = async (req, res) => {
    const { fullName, phoneNumber, email } = req.body;
    const user = await User.findById(req.user.id);

    // Checks for parameter in body field
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (fullName) {
        user.fullName = fullName;
    }

    if (phoneNumber) {
        user.phoneNumber = phoneNumber;
    }

    if (email) {
        user.email = email;
    }

    await user.save();

    res.json({ message: "Profile updated successfully!", user });
};
