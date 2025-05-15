import ReportLog from '../models/reportlog.model.js';
import AlertLog from '../models/alertlog.model.js';
import AutoBlacklist from '../models/autoblacklist.model.js';

export const checkAndAutoBlacklist = async (sender) => {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 🚨 Alert logic: 3+ unique users in last 10 minutes
  const recentReports = await ReportLog.aggregate([
    { $match: { sender, reportedAt: { $gte: tenMinutesAgo } } },
    { $group: { _id: "$userId" } },
    { $count: "uniqueUserCount" }
  ]);

  const recentCount = recentReports[0]?.uniqueUserCount || 0;

  if (recentCount >= 3) {
    const result = await AlertLog.findOneAndUpdate(
      { sender },
      { $setOnInsert: { sender, lastAlertAt: new Date() } },
      { upsert: true, new: false }
    );

    if (!result) {
      console.log(`[ALERT] Scam detected: 3+ users reported ${sender} in the last 10 minutes.`);
    } else {
      console.log(`[INFO] Alert already logged for ${sender}`);
    }
  }

  // 🔒 Auto-blacklist logic: 5+ unique users in last 24 hours
  const dayReports = await ReportLog.aggregate([
    { $match: { sender, reportedAt: { $gte: twentyFourHoursAgo } } },
    { $group: { _id: "$userId" } },
    { $count: "uniqueUserCount" }
  ]);

  const dayCount = dayReports[0]?.uniqueUserCount || 0;

  const alreadyListed = await AutoBlacklist.findOne({ phoneNumber: sender });

  if (dayCount >= 5) {
    if (!alreadyListed) {
      await AutoBlacklist.create({ phoneNumber: sender });
      console.log(`[AUTO-BLACKLIST] ${sender} has been auto-blacklisted (5+ users in 24h)`);
    } else {
      console.log(`[INFO] ${sender} already in auto-blacklist`);
    }
  }
};
