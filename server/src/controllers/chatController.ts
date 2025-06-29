import { Request, Response } from "express";
import { codingAgent } from "../agents/codingAgent";
import problemModel from "../models/problems_model";

interface ChatRequest {
  message: string;
  problemId: string;
  currentCode?: string;
  language?: string;
  testCases?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  problemTitle?: string;
  problemDescription?: string;
}

export const chatWithAgent = async (req: Request, res: Response) => {
  try {
    const {
      message,
      problemId,
      currentCode,
      language,
      testCases,
      problemTitle,
      problemDescription,
    }: ChatRequest = req.body;

    if (!message || !problemId) {
      return res.status(400).json({
        error: "Message and problemId are required",
      });
    }

    let problem;
    let title = problemTitle;
    let description = problemDescription;
    let visibleTestCases = testCases;

    if (!title || !description || !testCases) {
      // Fetch the current problem details from database
      problem = await problemModel.findById(problemId);
      if (!problem) {
        return res.status(404).json({
          error: "Problem not found",
        });
      }
      title = problem.title;
      description = problem.description;
      visibleTestCases = problem.visibleTestCases;
    }

    // Build context for the agent
    let contextMessage = `CURRENT PROBLEM CONTEXT:

Problem Title: ${title}
${problem ? `Difficulty: ${problem.difficulty}` : ""}
${problem ? `Tags: ${problem.tags.join(", ")}` : ""}

Problem Description:
${description}

Visible Test Cases:`;

    visibleTestCases?.forEach((testCase, index) => {
      contextMessage += `
Test Case ${index + 1}:
Input: ${testCase.input}
Expected Output: ${testCase.output}
${testCase.explanation ? `Explanation: ${testCase.explanation}` : ""}`;
    });

    if (currentCode && language) {
      contextMessage += `

USER'S CURRENT CODE (${language}):
\`\`\`${language}
${currentCode}
\`\`\``;
    }

    contextMessage += `

USER'S QUESTION: ${message}

Please provide helpful guidance based on the problem context and the user's current progress.`;

    // Get response from the agent
    const response = await codingAgent.generate(contextMessage, {
      // Add any necessary options here based on Mastra's API
    });

    res.status(200).json({
      response: response.text,
      success: true,
    });
  } catch (error: any) {
    console.error("Error in chat with agent:", error);
    res.status(500).json({
      error: "Failed to process chat request",
      message: error.message,
    });
  }
};

