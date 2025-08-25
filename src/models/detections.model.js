import mongoose from "mongoose";

const detectionsSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
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
});

const Detections = mongoose.model("Detections", detectionsSchema);
export default Detections;
