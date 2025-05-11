import { Router }      from 'express';
import { query }       from 'express-validator';
import { checkTrusted } from '../controllers/contacts.controller.js';

const router = Router();

router.get(
  '/check',
  [
    query('userId').isMongoId().withMessage('userId must be a valid Mongo ID'),
    query('phoneNumber').notEmpty().withMessage('phoneNumber is required'),
  ],
  checkTrusted
);

export default router;