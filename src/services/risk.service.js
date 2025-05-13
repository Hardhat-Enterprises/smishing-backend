// src/services/risk.service.js
import Risk from "../models/risk.model.js";
// src/services/risk.service.js
import { normalizeScore, 
         checkBrowserRisk,
         checkAppRisk,
         checkPlayProtect } from "../utils/risk.util.js";



const analyzeRisk = async (userId, hasVpn, isEncrypted, permissions, clickedLinks, has2FA, browser, installedApps, isPlayProtectEnabled) => {

    let totalScore = 0;
    let riskFactors = [];

    // 1️⃣ VPN Detection
    if (!hasVpn) {
        totalScore += 10;
        riskFactors.push("No VPN Detected");
    }

    // 2️⃣ Device Encryption
    if (!isEncrypted) {
        totalScore += 20;
        riskFactors.push("Device Not Encrypted");
    }

    // 3️⃣ Permissions Analysis
    if (permissions.length > 3) {
        totalScore += 15;
        riskFactors.push("Multiple Apps with Dangerous Permissions");
    }

    // 4️⃣ Link History
    if (clickedLinks > 0) {
        totalScore += 5;
        riskFactors.push("Clicked on Suspicious Links");
    }

    // 5️⃣ Two-Factor Authentication
    if (!has2FA) {
        totalScore += 15;
        riskFactors.push("Two-Factor Authentication Not Enabled");
    }
    // Browser Analysis
    const browserRisk = checkBrowserRisk(browser);
    if (browserRisk > 0) {
        totalScore += browserRisk;
        riskFactors.push("Outdated or Insecure Browser Detected");
    }

    // App Installations Analysis
    const appRisk = checkAppRisk(installedApps);
    if (appRisk > 0) {
        totalScore += appRisk;
        riskFactors.push("Risky Apps Detected");
    }

    // Google Play Protect
    const playProtectRisk = checkPlayProtect(isPlayProtectEnabled);
    if (playProtectRisk > 0) {
        totalScore += playProtectRisk;
        riskFactors.push("Google Play Protect Not Enabled");
    }
    // 🔄 Normalize Score
    totalScore = normalizeScore(totalScore);

    // 🔄 Save to DB
    const risk = new Risk({
        userId,
        riskScore: totalScore,
        riskFactors,
        createdAt: new Date()
    });

    await risk.save();

    return {
        riskScore: totalScore,
        riskFactors,
    };
};
export default analyzeRisk;
