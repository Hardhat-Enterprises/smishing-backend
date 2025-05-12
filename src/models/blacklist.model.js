import mongoose from 'mongoose';

const BlacklistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  }
});

const Blacklist = mongoose.model('Blacklist', BlacklistSchema);
export default Blacklist;
