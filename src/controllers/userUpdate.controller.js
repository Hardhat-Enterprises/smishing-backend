import User from "../models/user.model.js";
import { comparePassword } from "../utils/token.util.js";
import Contact from "../models/contact.model.js";

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

// GET /me
export const getProfile = async (req, res) => {
    const user = await User.findById(req.user.id).select("-passwordHash");

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
};

// POST /preview
export const previewUpdate = async (req, res) => {
    const { fullName, phoneNumber, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    let errors = [];

    // Validate phone number
    if (phoneNumber) {
        if (!/^\d+$/.test(phoneNumber)) {
            errors.push("Phone number must contain digits only (no spaces or special characters).");
        }
    }

    // Validate email
    if (email) {
        if (/\s/.test(email)) {
            errors.push("Email must not contain spaces.");
        }
        if (!emailRegex.test(email)) {
            errors.push("Invalid email format.");
        }
    }

    // If any validation errors exist, return them all
    if (errors.length > 0) {
        return res.status(400).json({ message: "Validation failed", errors });
    }

    // If no errors, build preview object
    const previewUser = {
        fullName: fullName || user.fullName,
        phoneNumber: phoneNumber || user.phoneNumber,
        email: email || user.email,
    };

    res.json({
        message: "Preview of your profile after updating:",
        preview: previewUser,
    });
};

// PUT /update
export const updateProfile = async (req, res) => {
    const { fullName, phoneNumber, email, password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Initialize tracking fields if missing
    if (!user.failedUpdateAttempts) user.failedUpdateAttempts = 0;
    if (!user.lastFailedUpdateAttempt) user.lastFailedUpdateAttempt = new Date(0);

    // Reset attempts if >24h
    const now = new Date();
    const minutesSinceLastAttempt = (now - user.lastFailedUpdateAttempt) / (1000 * 60);
    if (minutesSinceLastAttempt >= 15) {
        user.failedUpdateAttempts = 0;
    }

    // Check if locked out
    if (user.failedUpdateAttempts >= 3) {
        return res.status(403).json({
            message: "Too many failed attempts. Please try again after 24 hours.",
        });
    }

    // Require password
    if (!password) {
        return res.status(400).json({ message: "Password is required to update profile." });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
        user.failedUpdateAttempts += 1;
        user.lastFailedUpdateAttempt = new Date();
        await user.save();

        return res.status(401).json({
            success: false,
            message: "Invalid password.",
            attemptsLeft: 3 - user.failedUpdateAttempts,
        });
    }

    // Password correct → reset attempts
    user.failedUpdateAttempts = 0;
    user.lastFailedUpdateAttempt = null;

    // Update fields with validation
    if (fullName) user.fullName = fullName;

    if (phoneNumber) {
        if (!/^\d+$/.test(phoneNumber)) {
            return res
                .status(400)
                .json({ message: "Phone number must contain digits only (no spaces or special characters)." });
        }
        if (phoneNumber === user.phoneNumber) {
            return res.status(400).json({ message: "New phone number must be different from the current one." });
        }
        user.phoneNumber = phoneNumber;
    }

    if (email) {
        if (/\s/.test(email)) {
            return res.status(400).json({ message: "Email must not contain spaces." });
        }
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
        }
        user.email = email;
    }

    await user.save();

    res.json({ message: "Profile updated successfully!", user });
};

// PATCH /deactivate
export const deactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.isActive = false;
        await user.save();

        res.status(200).json({ message: "Account has been deactivated" });
    } catch (error) {
        res.status(500).json({ message: "Error deactivating account" });
    }
};

// PATCH /reactivate
export const reactivateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isActive) {
            return res.status(400).json({ message: "Account is not deactivated" });
        }

        user.isActive = true;
        await user.save();

        res.status(200).json({ message: "Account has been reactivated" });
    } catch (error) {
        res.status(500).json({ message: "Error reactivating account" });
    }
};

// DELETE /
export const deleteAccount = async (req, res) => {
    const { password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(401).json({ message: "User not found" });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
        return res.status(404).json({ message: "Invalid password, unable to delete account" });
    }

    try {
        // Delete all contacts related to user
        await Contact.deleteMany({ user: req.user.id });

        // Delete user's account
        await User.findByIdAndDelete(req.user.id);

        res.status(200).json({ message: "Account successfully deleted" });
    } catch (error) {
        res.status(500).json({ message: "An unexpected error occurred, cannot delete account" });
    }
};
