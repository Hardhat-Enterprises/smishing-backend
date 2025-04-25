import express from "express";
import path from "path";

const router = express.Router();

router.get("/privacy", (req, res) => {
  // Use process.cwd() to go to project root
  const filePath = path.join(process.cwd(), "docs", "privacy-policy.md");
  res.sendFile(filePath, err => {
    if (err) {
      res.status(500).send("Privacy policy not available.");
    }
  });
});

export default router;
