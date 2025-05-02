const express = require("express");
const QuizQuestion = require("../models/QuizQuestion");
const router = express.Router();
const UserScore = require("../models/UserScore");

// Get all questions (without correct answer index)
router.get("/", async (req, res) => {
    const category = req.query.category || "beginner";
    const questions = await QuizQuestion.find({ category }, { correctAnswerIndex: 0 });
    res.json(questions);
});

// Submit quiz answers
router.post("/submit", async (req, res) => {
    const { answers, username, category } = req.body;
    const questions = await QuizQuestion.find({ category });
    let score = 0;

    questions.forEach((q, i) => {
        if (answers[i] === q.correctAnswerIndex) score++;
    });

    const result = new UserScore({
        username,
        category,
        score,
        total: questions.length,
    });
    await result.save();

    res.json({ score, total: questions.length });
});

// rout for user History
router.get("/score/:username", async (req, res) => {
    const scores = await UserScore.find({ username: req.params.username }).sort({ date: -1 });
    res.json(scores);
});

module.exports = router;
