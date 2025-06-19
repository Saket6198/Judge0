import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware";
import {createProblem, deleteProblem, getProblemById, updateProblem, getAllProblems, getProblemsSolvedByUser } from "../controllers/userProblem";
import { userMiddleware } from "../middleware/userMiddleware";
const app = express();
app.use(express.json());
const problemRouter = express.Router();

// Create problem route
problemRouter.post('/create', adminMiddleware, createProblem);

// Update a problem route
problemRouter.patch('/:id', adminMiddleware, updateProblem);

//delete a problem route
problemRouter.delete('/delete/:id', adminMiddleware, deleteProblem);

// Get a particular problem route
problemRouter.get('/problemById/:id',userMiddleware, getProblemById);

// Get all problems route
problemRouter.get('/getAllProblem',userMiddleware, getAllProblems);


// Get problems by user route
problemRouter.get("/user",userMiddleware, getProblemsSolvedByUser);

export default problemRouter;

