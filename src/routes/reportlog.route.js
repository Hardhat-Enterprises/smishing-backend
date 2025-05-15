import express from 'express';
import ReportLog from '../models/reportlog.model.js';
import { checkAndAutoBlacklist } from '../controllers/autoblacklist.controller.js';

const router = express.Router();

router.post('/simulate-report', async (req, res) => {
  const { sender, userId } = req.body;

  if (!sender || !userId) {
    return res.status(400).json({ message: 'sender and userId are required' });
  }

  await ReportLog.create({ sender, userId });
  await checkAndAutoBlacklist(sender);

  res.status(200).json({ message: `Report from ${userId} for ${sender} logged.` });
});

export default router;
