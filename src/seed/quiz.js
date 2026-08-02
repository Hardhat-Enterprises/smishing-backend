const QuizQuestion = require("../models/QuizQuestion");

const seedQuestions = async () => {
    const questions = [
        {
            question: "What is Smishing?",
            options: [
                "An attack through SMS messages",
                "Email phishing",
                "Social engineering via calls",
                "None of the above",
            ],
            correctAnswerIndex: 0,
            category: "beginner",
        },
        {
            question: "Which of the following is a smishing red flag?",
            options: ["Urgency", "Random links", "Unfamiliar numbers", "All of the above"],
            correctAnswerIndex: 3,
            category: "beginner",
        },
        {
            question: "What can attackers do with smishing info?",
            options: ["Access bank accounts", "Install spyware", "Steal identities", "All of the above"],
            correctAnswerIndex: 3,
            category: "advanced",
        },
    ];

    await QuizQuestion.deleteMany({});
    await QuizQuestion.insertMany(questions);
    console.log("Quiz questions seeded.");
};

module.exports = seedQuestions;
