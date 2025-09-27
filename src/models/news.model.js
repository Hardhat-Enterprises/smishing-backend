import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            trim: true,
        },
        url: {
            type: String,
            required: true,
            unique: true,
        },
        urlToImage: {
            type: String,
        },
        publishedAt: {
            type: Date,
            required: true,
        },
        source: {
            name: {
                type: String,
                required: true,
            },
            id: {
                type: String,
            },
        },
        author: {
            type: String,
        },
        category: {
            type: String,
            enum: ["cybersecurity", "data-breach", "malware", "phishing"],
            default: "cybersecurity",
            required: true,
        },
        tags: [{
            type: String,
            lowercase: true,
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
        fetchedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { 
        timestamps: true,
        indexes: [
            { publishedAt: -1 },
            { category: 1 },
            { isActive: 1 },
            { "source.name": 1 },
        ]
    }
);

// Compound index for efficient queries
newsSchema.index({ isActive: 1, publishedAt: -1 });
newsSchema.index({ category: 1, publishedAt: -1 });

const News = mongoose.model("News", newsSchema);
export default News;