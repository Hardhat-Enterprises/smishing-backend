import mongoose from "mongoose";

const securityAuditSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        email: {
            type: String,
            default: "",
        },
        eventType: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["success", "failure", "warning"],
            required: true,
        },
        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "low",
        },
        ip: {
            type: String,
            default: "",
        },
        userAgent: {
            type: String,
            default: "",
        },
        details: {
            type: String,
            default: "",
        },
    },
    { timestamps: true },
);

const SecurityAudit = mongoose.model("SecurityAudit", securityAuditSchema);

export default SecurityAudit;
