import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true },
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
