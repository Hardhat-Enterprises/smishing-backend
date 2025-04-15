const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

router.post('/check-message', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string.' });
  }

  const python = spawn('python', ['ml/predict.py', message]);

  let result = '';
  python.stdout.on('data', (data) => {
    result += data.toString();
  });

  python.stderr.on('data', (data) => {
    console.error(`Python error: ${data}`);
  });

  python.on('close', (code) => {
    res.status(200).json({
      prediction: result.trim(),
      message,
    });
  });
});

module.exports = router;
