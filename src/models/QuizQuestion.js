const mongoose = require("mongoose");

const quizQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true },
    category: { type: String, enum: ["beginner", "advanced"], required: true },
});

module.exports = mongoose.model("QuizQuestion", quizQuestionSchema);
