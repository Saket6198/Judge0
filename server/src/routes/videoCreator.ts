import express from "express";
import { userMiddleware } from "../middleware/userMiddleware";
import {
  deleteVideo,
  generateUploadSignature,
  saveVideoMetadata,
  getVideoByProblemId,
} from "../controllers/videoSection";
export const videoRouter = express.Router();

videoRouter.get("/create", userMiddleware, generateUploadSignature);
videoRouter.post("/save", userMiddleware, saveVideoMetadata);
videoRouter.delete("/delete/:problemId", userMiddleware, deleteVideo);
videoRouter.get("/problem/:problemId", userMiddleware, getVideoByProblemId); // Debug route for specific problem
