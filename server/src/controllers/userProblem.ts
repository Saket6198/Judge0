import { Request, Response } from "express";
import {
  getLanguageById,
  submitBatch,
  submitToken,
} from "../utils/problemUtility";
import problemModel from "../models/problems_model";

const createProblem = async (req: Request, res: Response) => {
  const {
    title,
    difficulty,
    tags,
    description,
    visibleTestCases,
    HiddenTestCases,
    startCode,
    referenceSolution,
    problemCreator,
  } = req.body;

  try {
    // Test reference solutions against visible test cases
    for (const { language, solution } of referenceSolution) {
      const languageId = getLanguageById(language);

      const submissions = visibleTestCases.map((testcase: any) => ({
        source_code: solution,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));

      const submitResult = await submitBatch(submissions);
      console.log("submitResult", submitResult);
      const resultToken = submitResult.map((value: any) => value.token);

      const testResult = await submitToken(resultToken);
      console.log("testResult", testResult);
      // Check if all test cases passed
      const allPassed = testResult.every(
        (result: any) => result.status_id === 3
      );
      if (!allPassed) {
        res.status(400).json({
          error: `Reference solution for ${language} failed to pass visible test cases`,
        });
        return; // Return void instead of Response object
      }
    }

    // now if no error, then we can store it in db
    const userProblem = await problemModel.create({
      ...req.body,
      problemCreator: req.result._id,
    });

    res.status(200).json({
      message: "Problem created successfully",
      problemId: userProblem._id,
    });
  } catch (err: any) {
    res
      .status(400)
      .json({ error: "Error in creating problem: " + err.message });
  }
};

const updateProblem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) {
      res.status(400).json({ error: "Problem ID is required" });
      return; // Return void instead of Response object
    }
    const DsaProblem = await problemModel.findById(id);
    if (!DsaProblem) {
      res.status(404).json({ error: "Problem not found" });
      return; // Return void instead of Response object
    }
    const {
      title,
      difficulty,
      tags,
      description,
      visibleTestCases,
      hiddenTestCases,
      startCode,
      referenceSolution,
      problemCreator,
    } = req.body;
    // Test reference solutions against visible test cases
    for (const { language, solution } of referenceSolution) {
      const languageId = getLanguageById(language);

      const submissions = visibleTestCases.map((testcase: any) => ({
        source_code: solution,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output,
      }));
      const submitResult = await submitBatch(submissions);
      console.log("submitResult", submitResult);
      const resultToken = submitResult.map((value: any) => value.token);

      const testResult = await submitToken(resultToken);
      console.log("testResult", testResult);
      // Check if all test cases passed
      const allPassed = testResult.every(
        (result: any) => result.status_id === 3
      );
      if (!allPassed) {
        res.status(400).json({
          error: `Reference solution for ${language} failed to pass visible test cases`,
        });
        return; // Return void instead of Response object
      }
    }

    // now if no error, then we can store it in db
    const userProblem = await problemModel.findByIdAndUpdate(
      id,
      {
        ...req.body,
        problemCreator: req.result._id,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    res
      .status(200)
      .json({ message: "Problem updated successfully", problemId: id });
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Error in updating problem: " + err.message });
  }
};

const deleteProblem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) {
      res.status(400).json({ error: "Problem ID is required" });
      return; // Return void instead of Response object
    }
    const deletedProbem = await problemModel.findByIdAndDelete(id);
    if (!deletedProbem) {
      res.status(404).json({ error: "Problem not found" });
      return; // Return void instead of Response object
    }
    res.status(200).json({ message: "Problem deleted successfully" });
  } catch (err: any) {
    res
      .status(400)
      .json({ error: "Error in deleting problem: " + err.message });
  }
};

const getProblemById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) {
      res.status(400).json({ error: "Problem ID is required" });
      return; // Return void instead of Response object
    }
    const problem = await problemModel
      .findById(id)
      .select(
        "-HiddenTestCases -referenceSolution -problemCreator -createdAt -updatedAt -__v"
      );
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return; // Return void instead of Response object
    }
    res.status(200).json(problem);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Error in fetching problem: " + err.message });
  }
};

const getAllProblems = async (req: Request, res: Response) => {
  try {
    const problems = await problemModel
      .find({})
      .select("_id title difficulty tags");
    if (problems.length === 0) {
      res.status(404).json({ error: "No problems found" });
    }
    res.status(200).json(problems);
  } catch (err: any) {
    res
      .status(500)
      .json({ error: "Error in fetching problems: " + err.message });
  }
};

const getProblemsSolvedByUser = async (req: Request, res: Response) => {
  try {
    const user = await req.result.populate({
      path: "problemSolved",
      select: "_id title difficulty tags",
    });
    res.status(200).json(user);
    // const count = req.result.problemSolved.length;
    // res.status(200).json({count: count});
  } catch (err: any) {
    console.error("Error in getProblemsSolvedByUser:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

export {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllProblems,
  getProblemsSolvedByUser,
};
