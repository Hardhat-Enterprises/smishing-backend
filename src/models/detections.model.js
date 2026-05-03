import mongoose from "mongoose";

const detectionsSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },

    // Detection result fields added to store ML scan output
    messageContent: {
        type: String,
        default: "",
        trim: true,
    },
    result: {
        type: String,
        enum: ["smishing", "spam", "safe"],
        default: "safe",
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0,
    },
    advice: {
        type: String,
        default: "",
    },
    source: {
        type: String,
        enum: ["scan", "report"],
        default: "scan",
    },
});

const Detections = mongoose.model("Detections", detectionsSchema);
export default Detections;
