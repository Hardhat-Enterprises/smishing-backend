import express from 'express'
import spamController from '../controllers/spam.controller.js';

const router = express.Router();

// POST /textChecker
router.post('/textChecker', spamController.checkSpamMessage)

export default router;
