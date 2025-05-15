import ReportLog from '../models/reportlog.model.js';

export const logReportAndCheckAlert = async (sender) => {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);

  // 1. Save new report
  await ReportLog.create({ sender });

  // 2. Keep only last 50 reports
  const allReports = await ReportLog.find().sort({ reportedAt: -1 });
  if (allReports.length > 50) {
    const idsToDelete = allReports.slice(50).map(doc => doc._id);
    await ReportLog.deleteMany({ _id: { $in: idsToDelete } });
  }

  // 3. Check if 3+ recent reports match sender in last 10 min
  const recentReports = await ReportLog.find({
    sender,
    reportedAt: { $gte: tenMinutesAgo }
  });

  if (recentReports.length >= 3) {
    console.log(`[ALERT] Scam alert: 3+ reports for sender ${sender} in last 10 mins`);
    // Optional: Trigger mock email (handled by someone else)
  }
};
