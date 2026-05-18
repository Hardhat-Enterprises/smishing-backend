import speakeasy from "speakeasy";
import QRCode from "qrcode";

/**
 * Generate a random TOTP secret
 * Returns a base32-encoded string that can be used with Google Authenticator, Authy, etc.
 */
export const generateTotpSecret = () => {
    return speakeasy.generateSecret({
        length: 32,
        name: `Smishing Detector`,
    });
};

/**
 * Verify a TOTP token against a secret
 * @param {string} token - The 6-digit code from the authenticator app
 * @param {string} secret - The base32 TOTP secret
 * @returns {boolean} - True if valid, false otherwise
 */
export const verifyTotpToken = (token, secret) => {
    return speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 2, // Allow ±2 time windows (60 seconds) for clock skew
    });
};

/**
 * Generate a QR code data URL for TOTP setup
 * @param {object} secretObj - The object returned by generateTotpSecret() (has .secret and .otpauth_url)
 * @returns {Promise<string>} - Data URL of the QR code (PNG)
 */
export const generateTotpQrCode = async (secretObj) => {
    try {
        const qrDataUrl = await QRCode.toDataURL(secretObj.otpauth_url);
        return qrDataUrl;
    } catch (error) {
        console.error("Error generating QR code:", error);
        throw new Error("Failed to generate QR code");
    }
};

/**
 * Validate a TOTP token format (must be 6 digits)
 * @param {string} token - The token to validate
 * @returns {boolean}
 */
export const isValidTotpFormat = (token) => {
    return /^\d{6}$/.test(String(token).trim());
};
