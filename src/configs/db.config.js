
import mongoose from 'mongoose';

mongoose.set('strictQuery', true);  
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

export default connectDB;