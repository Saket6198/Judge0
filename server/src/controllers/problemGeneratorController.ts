import { Request, Response } from "express";
import { problemGeneratorAgent } from "../agents/problemGeneratorAgent";
import { problemGenerationSchema } from "../schemas/problemSchema";

interface ProblemGenerationRequest {
  description: string;
}

export const generateProblem = async (req: Request, res: Response) => {
  try {
    const { description }: ProblemGenerationRequest = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: "Problem description is required",
      });
    }

    if (description.length < 10) {
      return res.status(400).json({
        error: "Problem description should be at least 10 characters long",
      });
    }

    // Generate the problem using the agent
    const prompt = `Generate a complete coding problem based on this description: "${description}"

Please create a well-structured competitive programming problem that includes all required components. Ensure the problem is educational, balanced, and suitable for the specified difficulty level.

Remember to respond with ONLY a valid JSON object matching the required schema.`;

    console.log("Sending prompt to AI agent:", prompt);

    const response = await problemGeneratorAgent.generate(prompt);

    console.log("Raw AI agent response:", response.text);

    try {
      // Clean the response text to extract only JSON
      let jsonText = response.text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      // Remove any text before the first { or after the last }
      const firstBrace = jsonText.indexOf("{");
      const lastBrace = jsonText.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
      }

      console.log("Cleaned JSON text:", jsonText);

      // Parse the JSON response from the agent
      const generatedProblem = JSON.parse(jsonText);

      console.log(
        "Parsed problem object:",
        JSON.stringify(generatedProblem, null, 2)
      );

      // Validate the generated problem using Zod schema
      const validatedProblem = problemGenerationSchema.parse(generatedProblem);

      // Additional validation: Check if reference solutions contain main functions
      const cppSolution = validatedProblem.referenceSolution.find(
        (sol) => sol.language === "c++"
      );
      const javaSolution = validatedProblem.referenceSolution.find(
        (sol) => sol.language === "java"
      );
      const pythonSolution = validatedProblem.referenceSolution.find(
        (sol) => sol.language === "python"
      );

      if (!cppSolution?.solution.includes("int main(")) {
        throw new Error(
          "C++ reference solution must contain a main() function"
        );
      }

      if (!javaSolution?.solution.includes("public static void main(")) {
        throw new Error("Java reference solution must contain a main() method");
      }

      if (!pythonSolution?.solution.includes("input()")) {
        throw new Error("Python reference solution must handle input properly");
      }

      console.log("Validation successful, sending response");

      res.status(200).json({
        success: true,
        problem: validatedProblem,
      });
    } catch (parseError: any) {
      console.error("Error parsing/validating generated problem:", parseError);
      console.error("Raw response was:", response.text);

      if (parseError.name === "ZodError") {
        console.error(
          "Zod validation errors:",
          JSON.stringify(parseError.errors, null, 2)
        );

        res.status(500).json({
          error: "AI generated problem with invalid structure",
          message: "The AI response didn't match the required schema",
          details: parseError.errors,
        });
      } else {
        res.status(500).json({
          error: "Failed to parse AI response",
          message: "The AI generated an invalid JSON format",
          details: parseError.message,
        });
      }
    }
  } catch (error: any) {
    console.error("Error in problem generation:", error);
    res.status(500).json({
      error: "Failed to generate problem",
      message: error.message,
    });
  }
};
