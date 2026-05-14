import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema({
    message: String,

    score: Number,

    riskLevel: String,

    // Multiple scam categories support
    scamTypes: {
        type: [String],
        default: [],
    },

    // Store detected keywords
    matchedKeywords: {
        type: [String],
        default: [],
    },

    // Detection explanations
    reasons: {
        type: [String],
        default: [],
    },
});

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;
