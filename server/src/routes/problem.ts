import express from "express";
import {
  createProblem,
  getAllProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  getProblemsSolvedByUser,
} from "../controllers/userProblem";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { userMiddleware } from "../middleware/userMiddleware";
import { generateProblem } from "../controllers/problemGeneratorController";

const problemRouter = express.Router();

problemRouter.post("/create", adminMiddleware, createProblem as any);
problemRouter.get("/getAllProblem", getAllProblems as any);
problemRouter.get("/problemById/:id", getProblemById as any);
problemRouter.get("/user", userMiddleware, getProblemsSolvedByUser as any);
problemRouter.put("/:id", adminMiddleware, updateProblem as any);
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem as any);
problemRouter.post("/generate", adminMiddleware, generateProblem as any);

export default problemRouter;
