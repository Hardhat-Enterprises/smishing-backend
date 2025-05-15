import express from 'express';
import ReportLog from '../models/reportlog.model.js';
import AutoBlacklist from '../models/autoblacklist.model.js';

const router = express.Router();

router.get('/:phoneNumber', async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  try {
    const reportCount = await ReportLog.countDocuments({ sender: phoneNumber });

    const uniqueReporters = await ReportLog.aggregate([
      { $match: { sender: phoneNumber } },
      { $group: { _id: "$userId" } },
      { $count: "uniqueUserCount" }
    ]);

    const uniqueUserCount = uniqueReporters[0]?.uniqueUserCount || 0;

    const isAutoBlacklisted = await AutoBlacklist.findOne({ phoneNumber });

    // 🧠 Scoring logic
    let score = reportCount * 10 + uniqueUserCount * 5;
    if (isAutoBlacklisted) score += 30;

    if (score > 100) score = 100;

    let status = "Safe";
    if (score > 60) status = "Highly Suspicious";
    else if (score > 30) status = "Suspicious";

    return res.status(200).json({
      phoneNumber,
      reportCount,
      uniqueUserCount,
      isAutoBlacklisted: !!isAutoBlacklisted,
      score,
      status
    });

  } catch (err) {
    console.error('Error checking reputation:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;
