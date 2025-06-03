// src/models/detection.model.js
import mongoose from "mongoose";

const detectionSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true }, // or ObjectId if using ref
        label: { type: String, required: true }, // e.g., 'smishing' or 'ham'
    },
    {
        timestamps: true, // adds createdAt and updatedAt
    },
);

const Detection = mongoose.model("Detection", detectionSchema);
export default Detection;
