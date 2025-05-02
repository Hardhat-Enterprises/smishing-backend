const mongoose = require("mongoose");

const userScoreSchema = new mongoose.Schema({
    username: { type: String, required: true },
    category: { type: String, enum: ["beginner", "advanced"], required: true },
    score: Number,
    total: Number,
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserScore", userScoreSchema);
