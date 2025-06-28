import express from "express";
import { chatWithAgent } from "../controllers/chatController";
import { userMiddleware } from "../middleware/userMiddleware";

const chatRouter = express.Router();

// Chat with AI agent - requires authentication
chatRouter.post("/message", userMiddleware, chatWithAgent as any);


export { chatRouter };
