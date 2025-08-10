import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        passwordHash: { type: String, required: true },
        pinHash: { type: String, default: null }, // hashed 4–6 digit PIN (optional)
        isEmailVerified: { type: Boolean, default: false },
    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
