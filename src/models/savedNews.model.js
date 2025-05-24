import mongoose from 'mongoose';

const savedNewsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Fields from Google Search API response
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  snippet: {
    type: String
  },
  htmlSnippet: {
    type: String
  },
  displayLink: {
    type: String
  },
  formattedUrl: {
    type: String
  },
  // Additional metadata fields
  source: {
    type: String
  },
  publishedDate: {
    type: Date
  },
  // User customization fields
  tags: [{
    type: String
  }],
  notes: {
    type: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index for preventing duplicate saves
savedNewsSchema.index({ userId: 1, link: 1 }, { unique: true });

// Update timestamp on save
savedNewsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SavedNews = mongoose.model('SavedNews', savedNewsSchema);

export default SavedNews;