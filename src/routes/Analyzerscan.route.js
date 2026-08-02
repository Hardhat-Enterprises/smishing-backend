import { analyzeMessage } from '../services/simpleAnalyzer.js';

router.post('/simple', async (req, res) => {
  try {
    const { text } = req.body;
    const analysis = await analyzeMessage(text);
    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simple analyzer failed' });
  }
});
