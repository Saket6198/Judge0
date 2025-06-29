import { z } from "zod";

export const problemGenerationSchema = z.object({
  title: z
    .string()
    .min(6, "Title should be at least 6 characters")
    .max(25, "Title should not be more than 25 characters"),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters")
    .max(500, "Description should not be more than 500 characters"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z
    .array(
      z.enum([
        "array",
        "string",
        "tree",
        "graph",
        "dynamic programming",
        "greedy",
        "backtracking",
        "stack",
        "queue",
        "heap",
        "linked list",
        "math",
        "bit manipulation",
        "recursion",
        "hash table",
        "sliding window",
        "two pointers",
        "binary search",
        "sorting",
        "divide and conquer",
      ])
    )
    .min(1, "At least 1 tag is required")
    .max(5, "Maximum 5 tags allowed"),
  visibleTestCases: z
    .array(
      z.object({
        input: z.string().min(1, "Input cannot be empty"),
        output: z.string().min(1, "Output cannot be empty"),
        explanation: z
          .string()
          .min(5, "Explanation should be at least 5 characters")
          .max(200, "Explanation should not be more than 200 characters"),
      })
    )
    .length(2, "Exactly 2 visible test cases are required"),
  HiddenTestCases: z
    .array(
      z.object({
        input: z.string().min(1, "Input cannot be empty"),
        output: z.string().min(1, "Output cannot be empty"),
      })
    )
    .length(2, "Exactly 2 hidden test cases are required"),
  startCode: z
    .array(
      z.object({
        language: z.enum(["c++", "java", "python"]),
        initialCode: z.string().min(1, "Code cannot be empty"),
      })
    )
    .length(3, "Exactly 3 start code snippets are required"),
  referenceSolution: z
    .array(
      z.object({
        language: z.enum(["c++", "java", "python"]),
        solution: z.string().min(1, "Solution cannot be empty"),
      })
    )
    .length(3, "Exactly 3 reference solutions are required"),
});

export type ProblemGenerationData = z.infer<typeof problemGenerationSchema>;
