import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
    {
        message: {
            type: String,
            required: true,
            trim: true,
        },
        score: {
            type: Number,
            required: true,
        },
        riskLevel: {
            type: String,
            required: true,
            enum: ["LOW", "MEDIUM", "HIGH"],
        },
        reasons: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true },
);

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;
