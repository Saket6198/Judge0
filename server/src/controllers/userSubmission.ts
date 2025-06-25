import { Request, Response } from 'express';
import problemModel from '../models/problems_model';
import submissionModel from '../models/submissions';
import { getLanguageById, submitBatch, submitToken } from '../utils/problemUtility';

const runCode = async (req: Request, res: Response) => {
    try{
        const userId = req.result._id;
        const problemId = req.params.id;

        const {code, language} = req.body;

        if(!userId || !problemId || !code || !language) {
            res.status(400).json({ error: "Some fields are missing" });
            return;
        }

        // Check if the problem exists
        const problem = await problemModel.findById(problemId);
        if (!problem) {
            res.status(404).json({ error: "Problem not found" });
            return;
        }


        //judge0 ko code submit krna hai

        const languageId = getLanguageById(language);
            const submission = problem.visibleTestCases.map((testcase: any) => ({
                language_id: languageId,
                source_code: code,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

        console.log(submission);
        const submitResult = await submitBatch(submission);
        const resultToken = submitResult.map((value: any) => value.token);
        const testResult = await submitToken(resultToken);
        
        res.status(200).send({testResult});
    }catch(err: any) {
        console.error("Error in submitting code:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

const submitCode = async (req: Request, res: Response) => {
    try{
        const userId = req.result._id;
        const problemId = req.params.id;

        const {code, language} = req.body;

        if(!userId || !problemId || !code || !language) {
            res.status(400).json({ error: "Some fields are missing" });
            return;
        }

        // Check if the problem exists
        const problem = await problemModel.findById(problemId);
        if (!problem) {
            res.status(404).json({ error: "Problem not found" });
            return;
        }
        const submittedResult = await submissionModel.create({
            userId,
            problemId,
            code,
            language,
            status: "pending",
            testCasesTotal: problem.HiddenTestCases.length
        });

        //judge0 ko code submit krna hai

        const languageId = getLanguageById(language);
            const submission = problem.HiddenTestCases.map((testcase: any) => ({
                language_id: languageId,
                source_code: code,
                stdin: testcase.input,
                expected_output: testcase.output
            }));

        console.log(submission);
        const submitResult = await submitBatch(submission);
        const resultToken = submitResult.map((value: any) => value.token);
        const testResult = await submitToken(resultToken);
        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status: "pending" | "accepted" | "wrong" | "error" = 'accepted';
        let errorMessage = null;
        for(const result of testResult) {
            if(result.status_id == 3){
                testCasesPassed++;
                runtime += parseFloat(result.time);
                memory = Math.max(memory, result.memory);
            }else{  
                if(result.status_id == 4) {
                    status = 'error';
                }else{
                    status = 'wrong';
                }
                errorMessage = result.stderr
            }
        }
        submittedResult.status = status;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;
        submittedResult.errorMessage = errorMessage;
        await submittedResult.save();
        if (!req.result.problemSolved.includes(problemId)){
            req.result.problemSolved.push(problemId);
            await req.result.save();
        }
        res.status(200).send({ message: "Code submitted successfully",});
    }catch(err: any) {
        console.error("Error in submitting code:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

export const submittedProblem = async (req: Request, res: Response) => {
    try{
        const userId = req.result._id;
        const problemId = req.params.id;

        if(!userId || !problemId) {
            res.status(400).json({ error: "Some fields are missing" });
            return;
        }
        const ans = await submissionModel.find({userId, problemId});
        if(ans.length === 0) {
            res.status(404).json({ error: "No submission found for this problem" });
            return;
        }
        res.status(200).json({ans});
    }catch(err: any){
        console.error("Error in fetching submitted problem:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}

export { submitCode, runCode };