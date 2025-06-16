// phone.service.js
import twilio from "twilio";
import { twilioConfig } from "../configs/db.config.js";

const client = twilio(twilioConfig.accountSid, twilioConfig.authToken);

export const sendVerificationCode = async (phoneNumber) => {
    console.log("Sending OTP to:", phoneNumber); // Debugging line

    try {
        const response = await client.verify
            .services(twilioConfig.serviceId)
            .verifications.create({ to: phoneNumber, channel: "sms" });

        console.log("Twilio Response:", response); // Debugging line
        return response;
    } catch (error) {
        console.error("Twilio Error:", error.message); // Debugging line
        throw new Error("Failed to send verification code.");
    }
};

export const verifyCode = async (phoneNumber, code) => {
    try {
        const response = await client.verify.services(twilioConfig.serviceId)
            .verificationChecks
            .create({ to: phoneNumber, code: code });
        return response;
    } catch (error) {
        console.error('Twilio Verification Error:', error.message);
        throw new Error('Verification failed.');
    }
};
