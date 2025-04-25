import express from "express";
import User from "../models/user.model.js";
import authenticate from "../middleware/authenticate.js"; // update based on your setup

const router = express.Router();

router.post("/", authenticate, async (req, res) => {

    try {
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.consentGiven) return res.status(400).json({ message: "Consent already given" });

        user.consentGiven = true;
        user.consentDate = new Date();

        await user.save();

        res.status(200).json({ message: "Consent saved successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
});

export default router;
