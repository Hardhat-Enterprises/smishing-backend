import Blacklist from '../models/blacklist.model.js';

// Add a number to the blacklist
export const addToBlacklist = async (req, res) => {
  const { phoneNumber } = req.body;
  const userId = req.user._id;

  try {
    const exists = await Blacklist.findOne({ userId, phoneNumber });
    if (exists) {
      return res.status(400).json({ message: 'Number already blacklisted' });
    }

    const entry = new Blacklist({ userId, phoneNumber });
    await entry.save();

    res.status(201).json({ message: 'Number blacklisted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Get all blacklisted numbers for a user
export const getBlacklist = async (req, res) => {
  const userId = req.user._id;

  try {
    const blacklist = await Blacklist.find({ userId });
    res.status(200).json(blacklist);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch blacklist', details: err.message });
  }
};

// Remove a number from the blacklist
export const removeFromBlacklist = async (req, res) => {
  const userId = req.user._id;
  const { phoneNumber } = req.params;

  try {
    const result = await Blacklist.findOneAndDelete({ userId, phoneNumber });
    if (!result) {
      return res.status(404).json({ message: 'Number not found in blacklist' });
    }

    res.status(200).json({ message: 'Number removed from blacklist' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove number', details: err.message });
  }
};
