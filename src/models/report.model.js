import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["SPAM", "HARASSMENT", "INAPPROPRIATE", "VIOLENCE", "OTHER"],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        sourceId: {
            type: String,
            required: false,
        },
        sourceType: {
            type: String,
            required: false,
        },
        additionalInfo: {
            type: Object,
            default: {},
        },
        status: {
            type: String,
            enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
            default: "PENDING",
        },
    },
    { timestamps: true },
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
