import mongoose from 'mongoose';

const AlertLogSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    unique: true
  },
  lastAlertAt: {
    type: Date,
    default: Date.now
  }
});

const AlertLog = mongoose.models.AlertLog || mongoose.model('AlertLog', AlertLogSchema);
export default AlertLog;