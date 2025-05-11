import SavedNews from '../models/savedNews.model.js';
import mongoose from 'mongoose';

// Save a news article
export const saveNewsArticle = async (req, res) => {
  try {
    const { title, link, snippet, displayLink, source, publishedDate, tags, notes } = req.body;
    const userId = req.user._id;

    if (!title || !link) {
      return res.status(400).json({
        success: false,
        message: "Title and link are required fields."
      });
    }

    // Check if article is already saved by this user
    const existingArticle = await SavedNews.findOne({ userId, link });
    
    if (existingArticle) {
      return res.status(409).json({
        success: false,
        message: "This article is already in your saved collection."
      });
    }

    // Create new saved article
    const savedArticle = new SavedNews({
      userId,
      title,
      link,
      snippet,
      displayLink,
      source,
      publishedDate: publishedDate ? new Date(publishedDate) : undefined,
      tags,
      notes
    });

    await savedArticle.save();

    return res.status(201).json({
      success: true,
      message: "Article saved successfully.",
      data: savedArticle
    });
  } catch (error) {
    console.error("Error saving news article:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to save article."
    });
  }
};

// Get all saved news articles for a user
export const getSavedNews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, sort = '-createdAt', tags } = req.query;
    
    const query = { userId };
    
    // Filter by tags if provided
    if (tags) {
      const tagArray = tags.split(',');
      query.tags = { $in: tagArray };
    }

    // Pagination options
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: sort
    };

    const savedArticles = await SavedNews.find(query)
      .sort(sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit);
    
    const total = await SavedNews.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: savedArticles,
      pagination: {
        total,
        page: options.page,
        pages: Math.ceil(total / options.limit),
        limit: options.limit
      }
    });
  } catch (error) {
    console.error("Error fetching saved news:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved articles."
    });
  }
};

// Get a single saved article by ID
export const getSavedNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID."
      });
    }

    const savedArticle = await SavedNews.findOne({ _id: id, userId });

    if (!savedArticle) {
      return res.status(404).json({
        success: false,
        message: "Saved article not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: savedArticle
    });
  } catch (error) {
    console.error("Error fetching saved article:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch the saved article."
    });
  }
};

// Update a saved article
export const updateSavedNews = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { tags, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID."
      });
    }

    const savedArticle = await SavedNews.findOne({ _id: id, userId });

    if (!savedArticle) {
      return res.status(404).json({
        success: false,
        message: "Saved article not found."
      });
    }

    // Only allow updating tags and notes
    if (tags !== undefined) savedArticle.tags = tags;
    if (notes !== undefined) savedArticle.notes = notes;

    await savedArticle.save();

    return res.status(200).json({
      success: true,
      message: "Saved article updated successfully.",
      data: savedArticle
    });
  } catch (error) {
    console.error("Error updating saved article:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update the saved article."
    });
  }
};

// Delete a saved article
export const deleteSavedNews = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid article ID."
      });
    }

    const result = await SavedNews.findOneAndDelete({ _id: id, userId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Saved article not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Article removed from saved collection."
    });
  } catch (error) {
    console.error("Error deleting saved article:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to delete the saved article."
    });
  }
};