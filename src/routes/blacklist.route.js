import express from 'express';
import {
  addToBlacklist,
  getBlacklist,
  removeFromBlacklist
} from '../controllers/blacklist.controller.js';

const router = express.Router();

// Dummy middleware (replace with real authentication in production)
const dummyUserMiddleware = (req, res, next) => {
  req.user = { _id: '663fd7e1c8f6c7b59d04f450' }; // Replace with actual user ID
  next();
};

router.use(dummyUserMiddleware);

// POST /api/blacklist/add → Add a number to blacklist
router.post('/add', addToBlacklist);

// GET /api/blacklist → List all blacklisted numbers
router.get('/', getBlacklist);

// DELETE /api/blacklist/:phoneNumber → Remove a number from blacklist
router.delete('/:phoneNumber', removeFromBlacklist);

export default router;
