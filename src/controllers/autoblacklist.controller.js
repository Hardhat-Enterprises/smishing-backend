import AutoBlacklist from '../models/autoblacklist.model.js';
import ReportLog from '../models/reportlog.model.js';

export const checkAndAutoBlacklist = async (sender) => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const reports = await ReportLog.aggregate([
    {
      $match: {
        sender: sender,
        reportedAt: { $gte: twentyFourHoursAgo }
      }
    },
    {
      $group: { _id: "$userId" }
    },
    {
      $count: "uniqueUserCount"
    }
  ]);

  const count = reports[0]?.uniqueUserCount || 0;

  if (count >= 5) {
    const alreadyListed = await AutoBlacklist.findOne({ phoneNumber: sender });
    if (!alreadyListed) {
      await AutoBlacklist.create({ phoneNumber: sender });
      console.log(`[AUTO-BLACKLIST] ${sender} added to auto-blacklist (5+ users in 24h)`);
    }
  }
};
