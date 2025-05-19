import User from "../models/user.model.js";
import Contact from "../models/contact.model.js";

export const addContact = async (req, res) => {
    try {
        const { name, phoneNumber, email, relationship } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!name || !phoneNumber) {
            return res.status(400).json({ message: "Name and phone number are required" });
        }

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Validate relationship enum
        if (relationship && !["Family", "Friend", "Colleague", "Other"].includes(relationship)) {
            return res.status(400).json({ message: "Invalid relationship type" });
        }

        const contact = new Contact({
            user: userId,
            name,
            phoneNumber,
            email,
            relationship,
        });

        await contact.save();
        res.status(201).json(contact);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getContacts = async (req, res) => {
    try {
        const userId = req.user.id;

        // Verify user has permission to view these contacts
        if (userId !== req.params.userId) {
            return res.status(403).json({ message: "Unauthorized to view these contacts" });
        }

        const contacts = await Contact.find({
            user: req.params.userId,
        }).populate("user", "fullName email");
        res.json(contacts);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateContact = async (req, res) => {
    try {
        const { name, phoneNumber, email, relationship } = req.body;
        const userId = req.user.id;

        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        // Verify ownership
        if (contact.user.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to update this contact" });
        }

        // Validate relationship enum if provided
        if (relationship && !["Family", "Friend", "Colleague", "Other"].includes(relationship)) {
            return res.status(400).json({ message: "Invalid relationship type" });
        }

        contact.name = name || contact.name;
        contact.phoneNumber = phoneNumber || contact.phoneNumber;
        contact.email = email || contact.email;
        contact.relationship = relationship || contact.relationship;

        await contact.save();
        res.json(contact);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteContact = async (req, res) => {
    try {
        const userId = req.user.id;

        const contact = await Contact.findById(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        // Verify ownership
        if (contact.user.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized to delete this contact" });
        }

        await contact.deleteOne();
        res.json({ message: "Contact deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export default {
    addContact,
    getContacts,
    updateContact,
    deleteContact,
};
