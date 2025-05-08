import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },

        preferences: {
            darkMode: {
                type: Boolean,
                default: false,
            },
            autoDelete: {
                type: Boolean,
                default: false,
            },
        },
        // TO-DO: Add OTP
        /* isEmailVerified: {
      type: Boolean,
      default: false,
    }, */

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

    },
    { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
