// src/models/report.model.js
import mongoose from "mongoose";

/** Subdocument to store ML classification result */
const ClassificationSchema = new mongoose.Schema(
    {
        label: { type: String, enum: ["ham", "spam", "smishing"], required: true },
        badge: { type: String, enum: ["Safe", "Spam", "Smishing"] },
        confidence: { type: Number, min: 0, max: 1 },

        // NEW: track where the classification came from
        // (ml = FastAPI model; fallback = server-side heuristic)
        source: { type: String, enum: ["ml", "fallback"], default: "ml" },

        // Optional extras (useful for debugging/analysis)
        probabilities: { type: Map, of: Number }, // e.g. { ham: 0.12, spam: 0.34, smishing: 0.54 }
        severity: { type: String, enum: ["low", "medium", "high"] },
        model_version: { type: String },
    },
    { _id: false }, // don't create an _id for the subdoc
);

const ReportSchema = new mongoose.Schema(
    {
        phoneNumber: {
            type: String,
            required: true,
            trim: true,
            match: /^\+?[1-9]\d{6,14}$|^\d{7,15}$/, // simple E.164 or digits
        },
        messageText: { type: String, required: true, trim: true },
        source: { type: String, enum: ["android", "web", "test"], default: "android" },
        metadata: { type: Object, default: {} },

        // Heuristic analysis (quick score used as fallback/context)
        analysis: {
            riskScore: { type: Number, default: 0 },
            tags: { type: [String], default: [] },
        },

        // ML classification result (saved when available)
        classification: {
            type: ClassificationSchema,
            default: undefined,
        },
    },
    { timestamps: true },
);

// Useful indexes for querying by recency and class
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ "classification.label": 1, createdAt: -1 });

export default mongoose.model("Report", ReportSchema);
