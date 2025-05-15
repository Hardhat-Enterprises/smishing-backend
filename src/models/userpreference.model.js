import mongoose from 'mongoose';

const UserPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  }
});

const UserPreference = mongoose.models.UserPreference || mongoose.model('UserPreference', UserPreferenceSchema);
export default UserPreference;