import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    user: { type: String },
    message: { type: String, required: true },
    rating: { type: Number },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Feedback", feedbackSchema);
