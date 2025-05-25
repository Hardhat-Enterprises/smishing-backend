import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:         { type: String, required: true },
  phoneNumber:  { type: String, required: true },
  email:        { type: String },
  relationship: { type: String },
});

export default mongoose.model('Contact', contactSchema);