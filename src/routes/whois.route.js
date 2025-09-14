import express from "express";
const router = express.Router();

// ✅ Import with curly braces + .js extension
import { checkDomainAge } from "../services/whois.service.js";

// GET /whois/check?domain=example.com
router.get("/check", async (req, res) => {
    const { domain } = req.query;
    if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
    }

    const result = await checkDomainAge(domain);
    res.json(result);
});

export default router;
