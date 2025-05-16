// src/utils/risk.util.js

// Function to normalize the score to a maximum of 100
export const normalizeScore = (score) => {
    if (score > 100) return 100;
    if (score < 0) return 0;
    return score;
};
// Detect outdated or insecure browsers
export const checkBrowserRisk = (browser) => {
    const outdatedBrowsers = ["Internet Explorer", "Edge Legacy", "UC Browser"];
    return outdatedBrowsers.includes(browser) ? 15 : 0;
};

// Detect risky app installations
export const checkAppRisk = (installedApps) => {
    const riskyApps = ["com.cleaner.app", "com.supervpn.freevpn", "com.flashlight.free"];
    const riskyCount = installedApps.filter(app => riskyApps.includes(app)).length;
    return riskyCount * 10; // 10 points per risky app
};

// Google Play Protect status
export const checkPlayProtect = (isPlayProtectEnabled) => {
    return isPlayProtectEnabled ? 0 : 15;
};
export const calculatePermissionRisk = (permissions) => {
    const dangerousPermissions = [
        "READ_SMS",
        "SEND_SMS",
        "READ_CONTACTS",
        "ACCESS_FINE_LOCATION",
        "WRITE_EXTERNAL_STORAGE"
    ];
    return permissions.filter((perm) => dangerousPermissions.includes(perm)).length * 10;
};

export const calculateClickRisk = (clickedLinks) => {
    return clickedLinks > 3 ? 20 : clickedLinks * 5;
};
