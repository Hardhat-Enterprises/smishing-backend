// src/models/report.model.js
import mongoose from "mongoose";

/** Subdocument to store ML classification result */
const ClassificationSchema = new mongoose.Schema(
    {
        label: { type: String, enum: ["ham", "spam", "smishing"], required: true },
        badge: { type: String, enum: ["Safe", "Spam", "Smishing"] },
        confidence: { type: Number, min: 0, max: 1 },

        source: { type: String, enum: ["ml", "fallback"], default: "ml" },

        probabilities: { type: Map, of: Number },
        severity: { type: String, enum: ["low", "medium", "high"] },
        model_version: { type: String },
    },
    { _id: false },
);

const ReportSchema = new mongoose.Schema(
    {
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            match: /^\+?[1-9]\d{6,14}$|^\d{7,15}$/,
        },
        messageText: { type: String, required: true, trim: true },
        source: { type: String, enum: ["android", "web", "test"], default: "android" },
        metadata: { type: Object, default: {} },

        analysis: {
            riskScore: { type: Number, default: 0 },
            tags: { type: [String], default: [] },
        },

        classification: {
            type: ClassificationSchema,
            default: undefined,
        },

        // NEW REVIEW FIELDS
        status: {
            type: String,
            enum: ["new", "under_review", "reviewed"],
            default: "new",
        },
        reviewedBy: {
            type: String,
            default: "",
            trim: true,
        },
        reviewNotes: {
            type: String,
            default: "",
            trim: true,
        },
        correctedLabel: {
            type: String,
            enum: ["", "ham", "spam", "smishing"],
            default: "",
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ "classification.label": 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ correctedLabel: 1, createdAt: -1 });

export default mongoose.model("Report", ReportSchema);
