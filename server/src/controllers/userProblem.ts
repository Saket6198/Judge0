import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  getLanguageById,
  submitBatch,
  submitToken,
} from "../utils/problemUtility";
import problemModel from "../models/problems_model";
import { SolutionVideo } from "../models/solutionVideo";

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

    console.log("Getting problem by ID:", id);

    const problem = await problemModel
      .findById(id)
      .select("-HiddenTestCases -problemCreator -createdAt -updatedAt -__v");

    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return; // Return void instead of Response object
    }

    console.log("Found problem:", problem.title);
    console.log("Looking for video with problemId:", id);
    console.log("Converted ObjectId:", new mongoose.Types.ObjectId(id));

    // Try both ways to find the video - with ObjectId and string
    const videosWithObjectId = await SolutionVideo.findOne({
      problemId: new mongoose.Types.ObjectId(id),
    });
    const videosWithString = await SolutionVideo.findOne({ problemId: id });

    console.log(
      "Video found with ObjectId:",
      videosWithObjectId ? "Yes" : "No"
    );
    console.log("Video found with string:", videosWithString ? "Yes" : "No");

    const videos = videosWithObjectId || videosWithString;

    if (videos) {
      console.log("Video details found:", {
        _id: videos._id,
        problemId: videos.problemId,
        secureUrl: videos.secureUrl,
        duration: videos.duration,
        thumbnailUrl: videos.thumbnailUrl,
      });

      const responseData = {
        ...problem.toObject(),
        secureUrl: videos.secureUrl,
        duration: videos.duration,
        thumbnailUrl: videos.thumbnailUrl,
        cloudinaryPublicId: videos.cloudinaryPublicId,
      };

      console.log("Sending response with video data:", {
        title: responseData.title,
        secureUrl: responseData.secureUrl,
        duration: responseData.duration,
      });

      res.status(200).json(responseData);
    } else {
      console.log("No video found for this problem");
      res.status(200).json(problem.toObject());
    }
  } catch (err: any) {
    console.error("Error in getProblemById:", err);
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

    // Return the solved problems in the expected format
    res.status(200).json({
      problemSolved: user.problemSolved || [],
    });
  } catch (err: any) {
    console.error("Error in getProblemsSolvedByUser:", err);
    res.status(500).json({
      error: "Server Error",
      problemSolved: [], // Return empty array on error to prevent frontend crashes
    });
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
