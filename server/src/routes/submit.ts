import express from 'express';
import { userMiddleware } from '../middleware/userMiddleware';
import { submitCode, runCode, submittedProblem } from '../controllers/userSubmission';
import { rateLimiter } from '../middleware/rateLimiter';
const submitRouter = express.Router();

submitRouter.post('/run/:id', userMiddleware,rateLimiter, runCode);
submitRouter.post('/submit/:id', userMiddleware, rateLimiter,submitCode);
submitRouter.get('/submittedProblem/:id', userMiddleware, submittedProblem);


export default submitRouter;