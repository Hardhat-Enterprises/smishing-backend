import dialogflow from "dialogflow";
import config from "../configs/dialogflow.config.js";

const privateKey = config.googlePrivateKey;
const projectId = config.googleProjectId;
const sessionId = config.dialogFlowSessionId;

const credentials = {
    client_email: config.googleClientEmail,
    private_key: config.googlePrivateKey,
};
const sessionClient = new dialogflow.SessionsClient({ projectId, credentials });

export const textQuery = async (userText, userId) => {
    const sessionPath = sessionClient.sessionPath(projectId, sessionId + userId);

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: userText,
                languageCode: config.dialogFlowSessionLanguageCode,
            },
        },
    };
    try {
        const response = await sessionClient.detectIntent(request);
        console.log(response);
        return response;
    } catch (error) {
        console.error("ERROR:", error);
    }
};
