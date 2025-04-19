import express from "express";
import dialogflowController from "../controllers/dialogflow.controller.js";
const router = express.Router();

router.post("/chatbot", dialogflowController);

export default router;
