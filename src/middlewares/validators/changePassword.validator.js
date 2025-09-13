// src/middlewares/validators/changePassword.validator.js
export function validateChangePassword(req, res, next) {
    const { currentPassword, newPassword, confirmNewPassword } = req.body || {};

    const errors = [];
    if (!currentPassword) errors.push("currentPassword is required");
    if (!newPassword) errors.push("newPassword is required");
    if (!confirmNewPassword) errors.push("confirmNewPassword is required");
    if (newPassword && newPassword.length < 8) errors.push("newPassword must be at least 8 characters");
    if (newPassword && !/[A-Z]/.test(newPassword)) errors.push("newPassword must include an uppercase letter");
    if (newPassword && !/[a-z]/.test(newPassword)) errors.push("newPassword must include a lowercase letter");
    if (newPassword && !/\d/.test(newPassword)) errors.push("newPassword must include a number");
    if (newPassword && !/[^A-Za-z0-9]/.test(newPassword)) errors.push("newPassword must include a special character");
    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) errors.push("Passwords do not match");

    if (errors.length) {
        return res.status(400).json({ success: false, message: "Invalid input", errors });
    }
    next();
}
