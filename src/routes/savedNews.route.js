import express from 'express';
const router = express.Router();
import { 
  saveNewsArticle, 
  getSavedNews, 
  getSavedNewsById, 
  updateSavedNews, 
  deleteSavedNews 
} from '../controllers/savedNews.controller.js';
import { authenticate } from '../middlewares/news.middleware.js';

// All routes require authentication
router.use(authenticate);

// Save a news article
router.post('/', saveNewsArticle);

// Get all saved news articles for the authenticated user
router.get('/', getSavedNews);

// Get a specific saved article
router.get('/:id', getSavedNewsById);

// Update a saved article (tags/notes)
router.patch('/:id', updateSavedNews);

// Delete a saved article
router.delete('/:id', deleteSavedNews);

export default router;