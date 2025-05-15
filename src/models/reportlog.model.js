import mongoose from 'mongoose';

const ReportLogSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  reportedAt: {
    type: Date,
    default: Date.now
  }
});

const ReportLog = mongoose.models.ReportLog || mongoose.model('ReportLog', ReportLogSchema);
export default ReportLog;