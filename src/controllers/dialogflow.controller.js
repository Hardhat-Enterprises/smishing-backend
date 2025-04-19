// import chatbot from "../chatbot/chatbot.js";
import { textQuery } from "../chatbot/chatbot.js";

const dialogflowController = async (req, res) => {
    const { text, userId } = req.body;
    const resultQuery = await textQuery(text, req.body.userId);
    let result = resultQuery[0].queryResult.fulfillmentText;
    console.log(result);
    if (result == "") {
        result = "Sorry, I did not understand that.";
    }
    console.log(result);
    res.send({
        reply: result,
    });
};
export default dialogflowController;
