import { validationResult } from 'express-validator';
import User    from '../models/user.model.js';
import Contact from '../models/contact.model.js';

export async function checkTrusted(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, phoneNumber } = req.query;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const contact = await Contact.findOne({ user: userId, phoneNumber }).lean();
    if (!contact) {
      return res.json({ isTrusted: false });
    }
    const { name, email, relationship } = contact;
    res.json({
      isTrusted: true,
      contact: { name, phoneNumber, email, relationship }
    });
  } catch (err) {
    next(err);
  }
}