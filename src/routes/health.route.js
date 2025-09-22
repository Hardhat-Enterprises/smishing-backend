import express from "express";

const router = express.Router();

// GET /health - Check if backend is alive
router.get("/", (req, res) => {
    res.status(200).json({ status: "ok" });
});

export default router;
