import mongoose from 'mongoose';

const AutoBlacklistSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  autoBlacklistedAt: {
    type: Date,
    default: Date.now
  }
});

const AutoBlacklist = mongoose.model('AutoBlacklist', AutoBlacklistSchema);
export default AutoBlacklist;
