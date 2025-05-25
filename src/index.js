import 'dotenv/config';
import express from 'express';
import connectDB from './configs/db.config.js';

import authRouter    from './routes/auth.route.js';
import contactsRouter from './routes/contacts.route.js';

const app = express();
app.use(express.json());

// 1) connect
await connectDB();

// 2) mount
app.use('/api/auth',    authRouter);
app.use('/api/contacts', contactsRouter);

// 3) 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 4) error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});