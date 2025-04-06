const express = require('express');
const router = express.Router();

// POST /check-message
router.post('/check-message', async (req, res) => {
  const { message } = req.body;

  // Step 1: Validate input
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
  }

  // Step 2: Placeholder for preprocessing + ML prediction

  return res.status(200).json({
    result: 'Prediction will go here in next step.',
    message: message,
  });
});

module.exports = router;
