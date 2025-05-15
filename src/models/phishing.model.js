import mongoose from "mongoose";

const phishingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messageContent: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

const Phishing = mongoose.model("Phishing", phishingSchema);
export default Phishing;
