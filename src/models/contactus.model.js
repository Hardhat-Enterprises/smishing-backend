import mongoose from "mongoose";

const contactUsSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true, maxlength: 100 },
        email: { type: String, required: true, lowercase: true, trim: true },
        phoneNumber: { type: String, trim: true, maxlength: 25 },
        category: { type: String, enum: ["bug", "feedback", "support", "other"], default: "other" },
        message: { type: String, required: true, trim: true, maxlength: 500 },

        // Optional fields
        appVersion: { type: String },
        deviceInfo: { type: String },

        status: { type: String, enum: ["new", "open", "closed"], default: "new" },
    },
    { timestamps: true },
);

contactUsSchema.index({ createdAt: -1 });

export default mongoose.model("ContactUsMessage", contactUsSchema);
