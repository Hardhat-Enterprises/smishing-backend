import express from 'express';
import UserPreference from '../models/userpreference.model.js';

const router = express.Router();

// Set or update preferences
router.post('/set', async (req, res) => {
  const { userId, theme, notificationsEnabled } = req.body;

  if (!userId) return res.status(400).json({ message: 'userId is required' });

  const result = await UserPreference.findOneAndUpdate(
    { userId },
    { $set: { theme, notificationsEnabled } },
    { upsert: true, new: true }
  );

  res.status(200).json({ message: 'Preferences saved', preferences: result });
});

// Get preferences
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const preferences = await UserPreference.findOne({ userId });
  if (!preferences) return res.status(404).json({ message: 'Preferences not found' });
  res.status(200).json(preferences);
});

export default router;