import pkg from "google-libphonenumber";
const { PhoneNumberUtil, PhoneNumberType } = pkg;

const phoneUtil = PhoneNumberUtil.getInstance();

/**
 * Analyses a phone number and returns reputation signals
 * useful for smishing detection.
 *
 * @param {string} phoneNumber - The phone number to analyse
 * @returns {object} - Reputation analysis result
 */
export async function checkPhoneReputation(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== "string") {
        return { error: "Invalid phone number provided" };
    }

    try {
        const cleaned = phoneNumber.trim();
        const parsed = phoneUtil.parseAndKeepRawInput(cleaned, null);

        const isValid = phoneUtil.isValidNumber(parsed);
        const isPossible = phoneUtil.isPossibleNumber(parsed);
        const countryCode = phoneUtil.getRegionCodeForNumber(parsed);
        const numberType = phoneUtil.getNumberType(parsed);

        // Map number type to human readable
        const typeMap = {
            [PhoneNumberType.FIXED_LINE]: "fixed_line",
            [PhoneNumberType.MOBILE]: "mobile",
            [PhoneNumberType.FIXED_LINE_OR_MOBILE]: "fixed_line_or_mobile",
            [PhoneNumberType.TOLL_FREE]: "toll_free",
            [PhoneNumberType.PREMIUM_RATE]: "premium_rate",
            [PhoneNumberType.SHARED_COST]: "shared_cost",
            [PhoneNumberType.VOIP]: "voip",
            [PhoneNumberType.PERSONAL_NUMBER]: "personal_number",
            [PhoneNumberType.PAGER]: "pager",
            [PhoneNumberType.UAN]: "uan",
            [PhoneNumberType.UNKNOWN]: "unknown",
        };

        const lineType = typeMap[numberType] ?? "unknown";

        // Risk signals
        const isVoip = lineType === "voip";
        const isPremiumRate = lineType === "premium_rate";
        const isTollFree = lineType === "toll_free";
        const isUnknownType = lineType === "unknown";

        // Compute risk score
        let riskScore = 0;
        if (!isValid) riskScore += 30;
        if (isVoip) riskScore += 40;
        if (isPremiumRate) riskScore += 35;
        if (isUnknownType) riskScore += 20;
        if (isTollFree) riskScore += 10;
        riskScore = Math.min(riskScore, 100);

        const isSuspicious = riskScore >= 40;

        return {
            phoneNumber: cleaned,
            isValid,
            isPossible,
            countryCode: countryCode || "unknown",
            lineType,
            riskScore,
            isSuspicious,
            signals: {
                isVoip,
                isPremiumRate,
                isTollFree,
                isUnknownType,
            },
        };
    } catch (err) {
        console.error("Phone reputation error:", err.message);
        return {
            phoneNumber,
            isValid: false,
            isPossible: false,
            countryCode: "unknown",
            lineType: "unknown",
            riskScore: 20,
            isSuspicious: false,
            signals: {
                isVoip: false,
                isPremiumRate: false,
                isTollFree: false,
                isUnknownType: true,
            },
            error: err.message,
        };
    }
}
