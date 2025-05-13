import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

(async () => {
    try {
        console.log("Sending verification...");

        const response = await client.verify
            .services(process.env.TWILIO_SERVICE_ID)
            .verifications.create({
                to: "+61405549970",  // Replace with a real verified phone number
                channel: "sms"
            });

        console.log("✅ Twilio Response:", response);
    } catch (error) {
        console.error("❌ Twilio Error:", error.message);
    }
})();
