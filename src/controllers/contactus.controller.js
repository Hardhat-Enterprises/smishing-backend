import ContactUsMessage from "../models/contactus.model.js";

// Test error endpoint
export const testError = (req, res, next) => {
    try {
        throw new Error("This is a test error from ContactUs Controller!");
    } catch (err) {
        next(err);
    }
};

// Create a new message
export const create = async (req, res, next) => {
    try {
        const message = new ContactUsMessage(req.body);
        await message.save();
        res.status(201).json({
            success: true,
            message: "Thanks! Your message has been received.",
            data: { id: message._id },
        });
    } catch (err) {
        next(err);
    }
};

// Get all messages
export const getAll = async (req, res, next) => {
    try {
        const messages = await ContactUsMessage.find().sort({ createdAt: -1 });
        res.json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        next(err);
    }
};

// Get by ID
export const getById = async (req, res, next) => {
    try {
        const message = await ContactUsMessage.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }
        res.json({ success: true, data: message });
    } catch (err) {
        next(err);
    }
};

// Update status
export const updateStatus = async (req, res, next) => {
    try {
        const message = await ContactUsMessage.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true },
        );
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }
        res.json({ success: true, message: "Status updated", data: message });
    } catch (err) {
        next(err);
    }
};

// Delete
export const deleteMessage = async (req, res, next) => {
    try {
        const message = await ContactUsMessage.findByIdAndDelete(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }
        res.json({ success: true, message: "Message deleted" });
    } catch (err) {
        next(err);
    }
};
