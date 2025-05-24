import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: false,
            lowercase: true,
        },
        relationship: {
            type: String,
            required: true,
            enum: ["Family", "Friend", "Colleague", "Other"],
            default: "Other",
        },
    },
    { timestamps: true },
);

const Contact = mongoose.model("Contact", contactSchema);
export default Contact;
