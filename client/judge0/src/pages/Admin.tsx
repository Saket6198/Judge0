import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-toastify";
import { axiosClient } from "../utils/axiosClient";

// Define the tab type
type AdminTab = "create" | "update" | "delete";

const adminProblemSchema = z.object({
  title: z
    .string()
    .min(6, "Title should be at least 6 characters")
    .max(25, "Title should not be more than 25 characters"),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters")
    .max(500, "Description should not be more than 500 characters"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    errorMap: () => ({
      message: "Difficulty must be one of easy, medium, or hard",
    }),
  }),
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
    .min(1, "At least 1 tags are required")
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
    .min(1, "At least one visible test case is required"),
  HiddenTestCases: z
    .array(
      z.object({
        input: z.string().min(1, "Input cannot be empty"),
        output: z.string().min(1, "Output cannot be empty"),
      })
    )
    .min(1, "At least one hidden test case is required"),
  startCode: z
    .array(
      z.object({
        language: z.enum(["c", "c++", "java", "python", "javascript"], {
          errorMap: () => ({
            message: "Language must be one of c++, java, javascript, or python",
          }),
        }),
        initialCode: z.string().min(1, "Code cannot be empty"),
      })
    )
    .min(3, "At least 3 start code snippets are required for base languages"),
  referenceSolution: z
    .array(
      z.object({
        language: z.enum(["c", "c++", "java", "python", "javascript"], {
          errorMap: () => ({
            message: "Language must be one of c++, java, javascript, or python",
          }),
        }),
        solution: z.string().min(1, "Solution cannot be empty"),
      })
    )
    .min(3, "At least 3 reference solutions are required for base languages"),
});
type AdminProblemData = z.infer<typeof adminProblemSchema>;

export const Admin = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("create");
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);

  // AI Problem Generation states
  const [problemDescription, setProblemDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Default values for the form
  const defaultValues: Partial<AdminProblemData> = {
    visibleTestCases: [
      { input: "", output: "", explanation: "" },
      { input: "", output: "", explanation: "" },
    ],
    HiddenTestCases: [
      { input: "", output: "" },
      { input: "", output: "" },
    ],
    startCode: [
      {
        language: "c++" as const,
        initialCode: "// Add your C++ solution here",
      },
      {
        language: "java" as const,
        initialCode: "// Add your Java solution here",
      },
      {
        language: "python" as const,
        initialCode: "# Add your Python solution here",
      },
    ],
    referenceSolution: [
      {
        language: "c++" as const,
        solution: "// Add your C++ reference solution here",
      },
      {
        language: "java" as const,
        solution: "// Add your Java reference solution here",
      },
      {
        language: "python" as const,
        solution: "# Add your Python reference solution here",
      },
    ],
    tags: [], // Initialize as empty array
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<AdminProblemData>({
    resolver: zodResolver(adminProblemSchema),
    defaultValues: defaultValues as any,
  });

  const {
    fields: visibleTestCaseFields,
    append: appendVisibleTestCase,
    remove: removeVisibleTestCase,
  } = useFieldArray({
    control,
    name: "visibleTestCases",
  });

  const {
    fields: hiddenTestCaseFields,
    append: appendHiddenTestCase,
    remove: removeHiddenTestCase,
  } = useFieldArray({
    control,
    name: "HiddenTestCases",
  });

  const {
    fields: startCodeFields,
    append: appendStartCode,
    remove: removeStartCode,
  } = useFieldArray({
    control,
    name: "startCode",
  });

  const {
    fields: referenceSolutionFields,
    append: appendReferenceSolution,
    remove: removeReferenceSolution,
  } = useFieldArray({
    control,
    name: "referenceSolution",
  });
  type ProgrammingLanguage = "c" | "c++" | "java" | "python" | "javascript";

  const watchStartCodeLanguages =
    watch("startCode")?.map((item) => item.language) || [];

  // Helper to check if a language is already added
  const isLanguageAdded = (language: ProgrammingLanguage) => {
    return watchStartCodeLanguages.includes(language);
  };

  // Add new start code and reference solution for a language
  const addLanguage = (language: ProgrammingLanguage) => {
    if (!isLanguageAdded(language)) {
      appendStartCode({
        language: language,
        initialCode: `// Add your ${language} solution here`,
      });
      appendReferenceSolution({
        language: language,
        solution: `// Add your ${language} reference solution here`,
      });
    }
  };

  // Fetch all problems
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axiosClient.get("/problem/getAllProblem");
        setProblems(response.data);
      } catch (err: any) {
        toast.error(
          `Error fetching problems: ${err.response?.data?.error || err.message}`
        );
      }
    };

    fetchProblems();
  }, []);

  const onSubmit = async (data: AdminProblemData) => {
    try {
      setIsSubmitting(true);
      await axiosClient.post("/problem/create", data);
      toast.success("Problem created successfully!");
      navigate("/");
    } catch (err: any) {
      toast.error(
        `Error creating problem: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to fetch a specific problem for editing
  const fetchProblemDetails = async (id: string) => {
    try {
      setIsSubmitting(true);
      const response = await axiosClient.get(`/problem/problemById/${id}`);
      setSelectedProblem(response.data);
      setActiveTab("update"); // Switch to update tab
    } catch (err: any) {
      toast.error(
        `Error fetching problem details: ${
          err.response?.data?.error || err.message
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  }; // Function to update a problem
  const updateProblem = async (id: string, data: AdminProblemData) => {
    try {
      setIsSubmitting(true);
      await axiosClient.put(`/problem/${id}`, data);
      toast.success("Problem updated successfully!");

      // Refresh problem list
      const response = await axiosClient.get("/problem/getAllProblem");
      setProblems(response.data);

      setActiveTab("update"); // Stay on update tab
      setSelectedProblem(null);
    } catch (err: any) {
      toast.error(
        `Error updating problem: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to delete a problem
  const deleteProblem = async (id: string) => {
    try {
      if (window.confirm("Are you sure you want to delete this problem?")) {
        await axiosClient.delete(`/problem/delete/${id}`);
        toast.success("Problem deleted successfully!");
        // Refresh the problems list
        const response = await axiosClient.get("/problem/getAllProblem");
        setProblems(response.data);
      }
    } catch (err: any) {
      toast.error(
        `Error deleting problem: ${err.response?.data?.error || err.message}`
      );
    }
  };

  // Function to generate problem using AI
  const generateProblemWithAI = async () => {
    if (!problemDescription.trim()) {
      toast.error("Please enter a problem description");
      return;
    }

    try {
      setIsGenerating(true);
      const response = await axiosClient.post("/problem/generate", {
        description: problemDescription,
      });

      if (response.data.success) {
        const generatedProblem = response.data.problem;

        console.log("Generated problem received:", generatedProblem);

        // Reset form to default values first
        reset(defaultValues);

        // Small delay to ensure form is reset
        setTimeout(() => {
          // Set the generated values
          setValue("title", generatedProblem.title);
          setValue("description", generatedProblem.description);
          setValue("difficulty", generatedProblem.difficulty);
          setValue("tags", generatedProblem.tags);
          setValue("visibleTestCases", generatedProblem.visibleTestCases);
          setValue("HiddenTestCases", generatedProblem.HiddenTestCases);
          setValue("startCode", generatedProblem.startCode);
          setValue("referenceSolution", generatedProblem.referenceSolution);

          toast.success(
            "Problem generated successfully! Review and edit as needed."
          );
        }, 100);

        setShowAIGenerator(false);
        setProblemDescription("");
      } else {
        toast.error("Failed to generate problem");
      }
    } catch (err: any) {
      console.error("Error generating problem:", err);
      toast.error(
        `Error generating problem: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation Bar */}
      <div className="navbar bg-base-200 shadow-md mb-8">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl font-bold">
            Judge0
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <span className="text-xl font-bold">Admin Problem Manager</span>
        </div>
        <div className="navbar-end">
          <Link to="/" className="btn btn-ghost">
            Back to Problems
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Tab Navigation */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body p-2 md:p-4">
            <div className="join w-full">
              <button
                className={`btn join-item w-1/3 ${
                  activeTab === "create" ? "btn-primary" : ""
                }`}
                onClick={() => setActiveTab("create")}
              >
                Create Problem
              </button>
              <button
                className={`btn join-item w-1/3 ${
                  activeTab === "update" ? "btn-primary" : ""
                }`}
                onClick={() => setActiveTab("update")}
              >
                Update Problem
              </button>
              <button
                className={`btn join-item w-1/3 ${
                  activeTab === "delete" ? "btn-primary" : ""
                }`}
                onClick={() => setActiveTab("delete")}
              >
                Delete Problem
              </button>
            </div>
          </div>
        </div>

        {/* Create Problem Tab */}
        {activeTab === "create" && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-center mb-6">
                Create New Problem
              </h2>

              {/* AI Problem Generator */}
              <div className="card bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-primary/20 shadow-md mb-6">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <path d="M12 2L2 7l10 5 10-5-10-5z" />
                          <path d="M2 17l10 5 10-5" />
                          <path d="M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-primary">
                          AI Problem Generator
                        </h3>
                        <p className="text-sm text-base-content/70">
                          Generate a complete problem from your description
                          using AI
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-primary btn-sm"
                      onClick={() => setShowAIGenerator(!showAIGenerator)}
                    >
                      {showAIGenerator ? "Hide Generator" : "Use AI Generator"}
                    </button>
                  </div>

                  {showAIGenerator && (
                    <div className="space-y-4 pt-4 border-t border-primary/20">
                      <div className="form-control w-full">
                        <label className="label">
                          <span className="label-text font-medium">
                            Describe the problem you want to create
                          </span>
                        </label>
                        <textarea
                          className="textarea textarea-bordered h-32 w-full resize-y focus:textarea-primary"
                          placeholder="Example: Create a problem about finding the maximum sum of a subarray in an array of integers. The problem should be of medium difficulty and involve dynamic programming concepts."
                          value={problemDescription}
                          onChange={(e) =>
                            setProblemDescription(e.target.value)
                          }
                        />
                        <label className="label">
                          <span className="label-text-alt text-base-content/60">
                            Be specific about difficulty, concepts, and
                            constraints you want
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          className="btn btn-primary gap-2 flex-1"
                          onClick={generateProblemWithAI}
                          disabled={isGenerating || !problemDescription.trim()}
                        >
                          {isGenerating ? (
                            <>
                              <span className="loading loading-spinner loading-sm"></span>
                              Generating Problem...
                            </>
                          ) : (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                              </svg>
                              Generate Problem
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          className="btn btn-ghost gap-2"
                          onClick={() => {
                            setProblemDescription("");
                            setShowAIGenerator(false);
                          }}
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="alert alert-info">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          className="stroke-current shrink-0 w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm">
                          AI will generate a complete problem with test cases,
                          starter code, and solutions. You can review and edit
                          everything before submitting.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit as any)}
                className="space-y-8"
              >
                {/* Basic Information */}
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="text-xl font-bold">Basic Information</h3>

                    {/* Title */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">
                          Problem Title
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter a descriptive title"
                        className={`input input-bordered w-full ${
                          errors.title ? "input-error" : ""
                        }`}
                        {...register("title")}
                      />
                      {errors.title && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.title.message}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Description */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">
                          Problem Description
                        </span>
                      </label>
                      <textarea
                        placeholder="Describe the problem in detail"
                        className={`textarea textarea-bordered h-32 w-full ${
                          errors.description ? "textarea-error" : ""
                        }`}
                        {...register("description")}
                      />
                      {errors.description && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.description.message}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Difficulty */}
                    <div className="form-control w-full max-w-xs">
                      <label className="label">
                        <span className="label-text font-medium">
                          Difficulty Level
                        </span>
                      </label>
                      <select
                        className={`select select-bordered ${
                          errors.difficulty ? "select-error" : ""
                        }`}
                        {...register("difficulty")}
                      >
                        <option value="">Select Difficulty</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                      {errors.difficulty && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.difficulty.message}
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">
                          Tags (Select 3-5)
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[
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
                        ].map((tag) => (
                          <label
                            key={tag}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              value={tag}
                              className="checkbox checkbox-primary checkbox-sm"
                              {...register("tags")}
                            />
                            <span>{tag}</span>
                          </label>
                        ))}
                      </div>
                      {errors.tags && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {errors.tags.message}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>{" "}
                {/* Visible Test Cases */}
                <div className="card bg-base-100 shadow-md transition-all hover:shadow-lg">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-3">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="badge badge-primary badge-lg"></span>
                        Visible Test Cases
                      </h3>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm gap-2"
                        onClick={() =>
                          appendVisibleTestCase({
                            input: "",
                            output: "",
                            explanation: "",
                          })
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Test Case
                      </button>
                    </div>

                    <p className="text-sm mb-4 text-base-content/80">
                      These test cases will be visible to users attempting the
                      problem.
                    </p>

                    {visibleTestCaseFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="card bg-base-200 shadow-sm p-4 mb-6 border-l-4 border-primary transition-all hover:shadow-md"
                      >
                        <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-2">
                          <h4 className="font-bold flex items-center">
                            <span className="mr-2 badge badge-primary">
                              {index + 1}
                            </span>
                            Test Case #{index + 1}
                          </h4>
                          {index > 1 && (
                            <button
                              type="button"
                              className="btn btn-error btn-sm btn-outline gap-2"
                              onClick={() => removeVisibleTestCase(index)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="form-control w-full">
                            <label className="label">
                              <span className="label-text font-medium flex items-center gap-1 mr-5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Input
                              </span>
                            </label>
                            <textarea
                              className={`textarea textarea-bordered h-24 font-mono text-sm ${
                                errors.visibleTestCases?.[index]?.input
                                  ? "textarea-error"
                                  : "focus:textarea-primary"
                              }`}
                              placeholder="Enter test case input"
                              {...register(`visibleTestCases.${index}.input`)}
                            />
                            {errors.visibleTestCases?.[index]?.input && (
                              <label className="label">
                                <span className="label-text-alt text-error">
                                  {
                                    errors.visibleTestCases[index].input
                                      ?.message
                                  }
                                </span>
                              </label>
                            )}
                          </div>

                          <div className="form-control w-full">
                            <label className="label">
                              <span className="label-text font-medium flex items-center gap-1 mr-5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 8 22 12 18 12" />
                                  <path d="M16 12h-4v4" />
                                  <path d="M2 12h5.5a2.5 2.5 0 1 1 0 5H2" />
                                </svg>
                                Expected Output
                              </span>
                            </label>
                            <textarea
                              className={`textarea textarea-bordered h-24 font-mono text-sm ${
                                errors.visibleTestCases?.[index]?.output
                                  ? "textarea-error"
                                  : "focus:textarea-primary"
                              }`}
                              placeholder="Enter expected output"
                              {...register(`visibleTestCases.${index}.output`)}
                            />
                            {errors.visibleTestCases?.[index]?.output && (
                              <label className="label">
                                <span className="label-text-alt text-error">
                                  {
                                    errors.visibleTestCases[index].output
                                      ?.message
                                  }
                                </span>
                              </label>
                            )}
                          </div>
                        </div>

                        <div className="form-control w-full mt-4">
                          <label className="label">
                            <span className="label-text font-medium flex items-center gap-1 mr-5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="16" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12.01" y2="8" />
                              </svg>
                              Explanation
                            </span>
                          </label>
                          <textarea
                            className={`textarea textarea-bordered h-20 ${
                              errors.visibleTestCases?.[index]?.explanation
                                ? "textarea-error"
                                : "focus:textarea-primary"
                            }`}
                            placeholder="Explain how the output is calculated from the input"
                            {...register(
                              `visibleTestCases.${index}.explanation`
                            )}
                          />
                          {errors.visibleTestCases?.[index]?.explanation && (
                            <label className="label">
                              <span className="label-text-alt text-error">
                                {
                                  errors.visibleTestCases[index].explanation
                                    ?.message
                                }
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>{" "}
                {/* Hidden Test Cases */}
                <div className="card bg-base-100 shadow-md transition-all hover:shadow-lg">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-3">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="badge badge-secondary badge-lg"></span>
                        Hidden Test Cases
                      </h3>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm gap-2"
                        onClick={() =>
                          appendHiddenTestCase({ input: "", output: "" })
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Test Case
                      </button>
                    </div>

                    <p className="text-sm mb-4 text-base-content/80">
                      These test cases will be hidden from users and used for
                      final evaluation.
                    </p>

                    {hiddenTestCaseFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="card bg-base-200 shadow-sm p-4 mb-6 border-l-4 border-secondary transition-all hover:shadow-md"
                      >
                        <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-2">
                          <h4 className="font-bold flex items-center">
                            <span className="mr-2 badge badge-secondary">
                              {index + 1}
                            </span>
                            Test Case #{index + 1}
                            <span className="ml-2 text-xs text-base-content/60">
                              (Hidden)
                            </span>
                          </h4>
                          {index > 1 && (
                            <button
                              type="button"
                              className="btn btn-error btn-sm btn-outline gap-2"
                              onClick={() => removeHiddenTestCase(index)}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="form-control w-full">
                            <label className="label">
                              <span className="label-text font-medium flex items-center gap-1 mr-5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                                Input
                              </span>
                            </label>
                            <textarea
                              className={`textarea textarea-bordered h-24 font-mono text-sm ${
                                errors.HiddenTestCases?.[index]?.input
                                  ? "textarea-error"
                                  : "focus:textarea-secondary"
                              }`}
                              placeholder="Enter test case input"
                              {...register(`HiddenTestCases.${index}.input`)}
                            />
                            {errors.HiddenTestCases?.[index]?.input && (
                              <label className="label">
                                <span className="label-text-alt text-error">
                                  {errors.HiddenTestCases[index].input?.message}
                                </span>
                              </label>
                            )}
                          </div>

                          <div className="form-control w-full">
                            <label className="label">
                              <span className="label-text font-medium flex items-center gap-1 mr-5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="22 8 22 12 18 12" />
                                  <path d="M16 12h-4v4" />
                                  <path d="M2 12h5.5a2.5 2.5 0 1 1 0 5H2" />
                                </svg>
                                Expected Output
                              </span>
                            </label>
                            <textarea
                              className={`textarea textarea-bordered h-24 font-mono text-sm ${
                                errors.HiddenTestCases?.[index]?.output
                                  ? "textarea-error"
                                  : "focus:textarea-secondary"
                              }`}
                              placeholder="Enter expected output"
                              {...register(`HiddenTestCases.${index}.output`)}
                            />
                            {errors.HiddenTestCases?.[index]?.output && (
                              <label className="label">
                                <span className="label-text-alt text-error">
                                  {
                                    errors.HiddenTestCases[index].output
                                      ?.message
                                  }
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Start Code */}
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold">
                        Initial Code Templates
                      </h3>
                      <div className="dropdown dropdown-end">
                        <div
                          tabIndex={0}
                          role="button"
                          className="btn btn-primary btn-sm"
                        >
                          Add Language
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52"
                        >
                          {!isLanguageAdded("c") && (
                            <li>
                              <a onClick={() => addLanguage("c")}>C</a>
                            </li>
                          )}
                          {!isLanguageAdded("javascript") && (
                            <li>
                              <a onClick={() => addLanguage("javascript")}>
                                JavaScript
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {startCodeFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="card bg-base-200 shadow-sm p-4 mb-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold capitalize">
                            {field.language} Template
                          </h4>
                          {!["c++", "java", "python"].includes(
                            field.language
                          ) && (
                            <button
                              type="button"
                              className="btn btn-error btn-sm btn-outline"
                              onClick={() => {
                                // Find corresponding reference solution
                                const refIndex =
                                  referenceSolutionFields.findIndex(
                                    (ref) => ref.language === field.language
                                  );
                                if (refIndex > -1)
                                  removeReferenceSolution(refIndex);
                                removeStartCode(index);
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="form-control w-full">
                          <textarea
                            className={`textarea textarea-bordered font-mono h-36 ${
                              errors.startCode?.[index]?.initialCode
                                ? "textarea-error"
                                : ""
                            }`}
                            placeholder={`Add ${field.language} starter code`}
                            {...register(`startCode.${index}.initialCode`)}
                          />
                          <input
                            type="hidden"
                            {...register(`startCode.${index}.language`)}
                          />
                          {errors.startCode?.[index]?.initialCode && (
                            <label className="label">
                              <span className="label-text-alt text-error">
                                {errors.startCode[index].initialCode?.message}
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    ))}

                    {errors.startCode && !Array.isArray(errors.startCode) && (
                      <div className="alert alert-error">
                        <span>{errors.startCode.message}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Reference Solutions */}
                <div className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    <h3 className="text-xl font-bold mb-4">
                      Reference Solutions
                    </h3>

                    {referenceSolutionFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="card bg-base-200 shadow-sm p-4 mb-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-bold capitalize">
                            {field.language} Solution
                          </h4>
                        </div>

                        <div className="form-control w-full">
                          <textarea
                            className={`textarea textarea-bordered font-mono h-48 ${
                              errors.referenceSolution?.[index]?.solution
                                ? "textarea-error"
                                : ""
                            }`}
                            placeholder={`Add ${field.language} reference solution`}
                            {...register(`referenceSolution.${index}.solution`)}
                          />
                          <input
                            type="hidden"
                            {...register(`referenceSolution.${index}.language`)}
                          />
                          {errors.referenceSolution?.[index]?.solution && (
                            <label className="label">
                              <span className="label-text-alt text-error">
                                {
                                  errors.referenceSolution[index].solution
                                    ?.message
                                }
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    ))}

                    {errors.referenceSolution &&
                      !Array.isArray(errors.referenceSolution) && (
                        <div className="alert alert-error">
                          <span>{errors.referenceSolution.message}</span>
                        </div>
                      )}
                  </div>
                </div>
                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Creating...
                      </>
                    ) : (
                      "Create Problem"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update Problem Tab */}
        {activeTab === "update" && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-center mb-6">
                Update Problem
              </h2>
              {selectedProblem ? (
                <div className="alert alert-info mb-4">
                  <div>
                    <span>Editing problem: {selectedProblem.title}</span>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setSelectedProblem(null)}
                    >
                      Cancel Edit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Difficulty</th>
                        <th>Tags</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problems.map((problem) => (
                        <tr key={problem._id} className="hover:bg-base-300">
                          <td>{problem.title}</td>
                          <td>
                            <div
                              className={`badge ${
                                problem.difficulty === "easy"
                                  ? "badge-success"
                                  : problem.difficulty === "medium"
                                  ? "badge-warning"
                                  : "badge-error"
                              }`}
                            >
                              {problem.difficulty}
                            </div>
                          </td>
                          <td>
                            {Array.isArray(problem.tags) ? (
                              problem.tags.map((tag: string, index: number) => (
                                <div
                                  key={index}
                                  className="badge badge-neutral mr-1 mb-1"
                                >
                                  {tag}
                                </div>
                              ))
                            ) : (
                              <div className="badge badge-neutral">
                                {problem.tags}
                              </div>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => fetchProblemDetails(problem._id)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {problems.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-4">
                            No problems found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}{" "}
              {/* Update form */}{" "}
              {selectedProblem && (
                <div className="mt-6">
                  <form
                    className="space-y-8"
                    onSubmit={(e) => {
                      e.preventDefault();
                      // Build complete problem data from form fields
                      const updatedData = {
                        ...selectedProblem,
                        title: (
                          document.getElementById(
                            "edit-title"
                          ) as HTMLInputElement
                        ).value,
                        description: (
                          document.getElementById(
                            "edit-description"
                          ) as HTMLTextAreaElement
                        ).value,
                        difficulty: (
                          document.getElementById(
                            "edit-difficulty"
                          ) as HTMLSelectElement
                        ).value,
                        tags: Array.from(
                          document.querySelectorAll(
                            'input[name="edit-tags"]:checked'
                          )
                        ).map(
                          (checkbox) => (checkbox as HTMLInputElement).value
                        ),
                        visibleTestCases: selectedProblem.visibleTestCases?.map(
                          (tc: any, i: number) => ({
                            input:
                              (
                                document.getElementById(
                                  `edit-visible-input-${i}`
                                ) as HTMLTextAreaElement
                              )?.value || tc.input,
                            output:
                              (
                                document.getElementById(
                                  `edit-visible-output-${i}`
                                ) as HTMLTextAreaElement
                              )?.value || tc.output,
                            explanation:
                              (
                                document.getElementById(
                                  `edit-visible-explanation-${i}`
                                ) as HTMLTextAreaElement
                              )?.value || tc.explanation,
                          })
                        ),
                        HiddenTestCases: selectedProblem.HiddenTestCases?.map(
                          (tc: any, i: number) => ({
                            input:
                              (
                                document.getElementById(
                                  `edit-hidden-input-${i}`
                                ) as HTMLTextAreaElement
                              )?.value || tc.input,
                            output:
                              (
                                document.getElementById(
                                  `edit-hidden-output-${i}`
                                ) as HTMLTextAreaElement
                              )?.value || tc.output,
                          })
                        ),
                        startCode: selectedProblem.startCode?.map(
                          (sc: any, i: number) => ({
                            language: sc.language,
                            initialCode:
                              (
                                document.getElementById(
                                  `edit-startcode-${i}`
                                ) as HTMLTextAreaElement
                              )?.value || sc.initialCode,
                          })
                        ),
                        referenceSolution:
                          selectedProblem.referenceSolution?.map(
                            (rs: any, i: number) => ({
                              language: rs.language,
                              solution:
                                (
                                  document.getElementById(
                                    `edit-solution-${i}`
                                  ) as HTMLTextAreaElement
                                )?.value || rs.solution,
                            })
                          ),
                      };
                      updateProblem(selectedProblem._id, updatedData as any);
                    }}
                  >
                    {/* Basic Information for update */}
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body">
                        <h3 className="text-xl font-bold">Basic Information</h3>

                        {/* Title */}
                        <div className="form-control w-full">
                          <label className="label">
                            <span className="label-text font-medium">
                              Problem Title
                            </span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter a descriptive title"
                            className="input input-bordered w-full"
                            defaultValue={selectedProblem.title}
                            id="edit-title"
                            required
                          />
                        </div>

                        {/* Description */}
                        <div className="form-control w-full">
                          <label className="label">
                            <span className="label-text font-medium">
                              Problem Description
                            </span>
                          </label>
                          <textarea
                            placeholder="Describe the problem in detail"
                            className="textarea textarea-bordered h-32 w-full"
                            defaultValue={selectedProblem.description}
                            id="edit-description"
                            required
                          />
                        </div>

                        {/* Difficulty */}
                        <div className="form-control w-full max-w-xs">
                          <label className="label">
                            <span className="label-text font-medium">
                              Difficulty Level
                            </span>
                          </label>
                          <select
                            className="select select-bordered"
                            defaultValue={selectedProblem.difficulty}
                            id="edit-difficulty"
                            required
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>

                        {/* Tags */}
                        <div className="form-control w-full">
                          <label className="label">
                            <span className="label-text font-medium">Tags</span>
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {[
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
                            ].map((tag) => (
                              <label
                                key={tag}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  value={tag}
                                  name="edit-tags"
                                  className="checkbox checkbox-primary checkbox-sm"
                                  defaultChecked={selectedProblem.tags?.includes(
                                    tag
                                  )}
                                />
                                <span>{tag}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>{" "}
                    {/* Visible Test Cases */}
                    <div className="card bg-base-100 shadow-md transition-all hover:shadow-lg">
                      <div className="card-body">
                        <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-3">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="badge badge-primary badge-lg"></span>
                            Visible Test Cases
                          </h3>
                        </div>

                        <p className="text-sm mb-4 text-base-content/80">
                          These test cases will be visible to users attempting
                          the problem.
                        </p>

                        {selectedProblem.visibleTestCases?.map(
                          (testCase: any, index: number) => (
                            <div
                              key={index}
                              className="card bg-base-200 shadow-sm p-4 mb-6 border-l-4 border-primary transition-all hover:shadow-md"
                            >
                              <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-2">
                                <h4 className="font-bold flex items-center">
                                  <span className="mr-2 badge badge-primary">
                                    {index + 1}
                                  </span>
                                  Test Case #{index + 1}
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control w-full">
                                  <label className="label">
                                    <span className="label-text font-medium flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                      </svg>
                                      Input
                                    </span>
                                  </label>
                                  <textarea
                                    className="textarea textarea-bordered h-24 font-mono text-sm focus:textarea-primary"
                                    placeholder="Enter test case input"
                                    defaultValue={testCase.input}
                                    id={`edit-visible-input-${index}`}
                                    required
                                  />
                                </div>

                                <div className="form-control w-full">
                                  <label className="label">
                                    <span className="label-text font-medium flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="22 8 22 12 18 12" />
                                        <path d="M16 12h-4v4" />
                                        <path d="M2 12h5.5a2.5 2.5 0 1 1 0 5H2" />
                                      </svg>
                                      Expected Output
                                    </span>
                                  </label>
                                  <textarea
                                    className="textarea textarea-bordered h-24 font-mono text-sm focus:textarea-primary"
                                    placeholder="Enter expected output"
                                    defaultValue={testCase.output}
                                    id={`edit-visible-output-${index}`}
                                    required
                                  />
                                </div>
                              </div>

                              <div className="form-control w-full mt-4">
                                <label className="label">
                                  <span className="label-text font-medium flex items-center gap-1">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="12" y1="16" x2="12" y2="12" />
                                      <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    Explanation
                                  </span>
                                </label>
                                <textarea
                                  className="textarea textarea-bordered h-20 focus:textarea-primary"
                                  placeholder="Explain how the output is calculated from the input"
                                  defaultValue={testCase.explanation}
                                  id={`edit-visible-explanation-${index}`}
                                  required
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    {/* Hidden Test Cases */}
                    <div className="card bg-base-100 shadow-md transition-all hover:shadow-lg">
                      <div className="card-body">
                        <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-3">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <span className="badge badge-secondary badge-lg"></span>
                            Hidden Test Cases
                          </h3>
                        </div>

                        <p className="text-sm mb-4 text-base-content/80">
                          These test cases will be hidden from users and used
                          for final evaluation.
                        </p>

                        {selectedProblem.HiddenTestCases?.map(
                          (testCase: any, index: number) => (
                            <div
                              key={index}
                              className="card bg-base-200 shadow-sm p-4 mb-6 border-l-4 border-secondary transition-all hover:shadow-md"
                            >
                              <div className="flex justify-between items-center mb-4 border-b border-base-300 pb-2">
                                <h4 className="font-bold flex items-center">
                                  <span className="mr-2 badge badge-secondary">
                                    {index + 1}
                                  </span>
                                  Test Case #{index + 1}
                                  <span className="ml-2 text-xs text-base-content/60">
                                    (Hidden)
                                  </span>
                                </h4>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control w-full">
                                  <label className="label">
                                    <span className="label-text font-medium flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                      </svg>
                                      Input
                                    </span>
                                  </label>
                                  <textarea
                                    className="textarea textarea-bordered h-24 font-mono text-sm focus:textarea-secondary"
                                    placeholder="Enter test case input"
                                    defaultValue={testCase.input}
                                    id={`edit-hidden-input-${index}`}
                                    required
                                  />
                                </div>

                                <div className="form-control w-full">
                                  <label className="label">
                                    <span className="label-text font-medium flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="22 8 22 12 18 12" />
                                        <path d="M16 12h-4v4" />
                                        <path d="M2 12h5.5a2.5 2.5 0 1 1 0 5H2" />
                                      </svg>
                                      Expected Output
                                    </span>
                                  </label>
                                  <textarea
                                    className="textarea textarea-bordered h-24 font-mono text-sm focus:textarea-secondary"
                                    placeholder="Enter expected output"
                                    defaultValue={testCase.output}
                                    id={`edit-hidden-output-${index}`}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    {/* Start Code Templates */}
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body">
                        <h3 className="text-xl font-bold">
                          Initial Code Templates
                        </h3>

                        {selectedProblem.startCode?.map(
                          (codeTemplate: any, index: number) => (
                            <div
                              key={index}
                              className="card bg-base-200 shadow-sm p-4 mb-4"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold capitalize">
                                  {codeTemplate.language} Template
                                </h4>
                              </div>

                              <div className="form-control w-full">
                                <textarea
                                  className="textarea textarea-bordered font-mono h-36"
                                  placeholder={`Add ${codeTemplate.language} starter code`}
                                  defaultValue={codeTemplate.initialCode}
                                  id={`edit-startcode-${index}`}
                                  required
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    {/* Reference Solutions */}
                    <div className="card bg-base-100 shadow-md">
                      <div className="card-body">
                        <h3 className="text-xl font-bold">
                          Reference Solutions
                        </h3>

                        {selectedProblem.referenceSolution?.map(
                          (solution: any, index: number) => (
                            <div
                              key={index}
                              className="card bg-base-200 shadow-sm p-4 mb-4"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold capitalize">
                                  {solution.language} Solution
                                </h4>
                              </div>

                              <div className="form-control w-full">
                                <textarea
                                  className="textarea textarea-bordered font-mono h-48"
                                  placeholder={`Add ${solution.language} reference solution`}
                                  defaultValue={solution.solution}
                                  id={`edit-solution-${index}`}
                                  required
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    {/* Update button */}
                    <div className="form-control mt-6">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="loading loading-spinner"></span>
                            Updating...
                          </>
                        ) : (
                          "Update Problem"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Problem Tab */}
        {activeTab === "delete" && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold text-center mb-6">
                Delete Problem
              </h2>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Difficulty</th>
                      <th>Tags</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((problem) => (
                      <tr key={problem._id} className="hover:bg-base-300">
                        <td>{problem.title}</td>
                        <td>
                          <div
                            className={`badge ${
                              problem.difficulty === "easy"
                                ? "badge-success"
                                : problem.difficulty === "medium"
                                ? "badge-warning"
                                : "badge-error"
                            }`}
                          >
                            {problem.difficulty}
                          </div>
                        </td>
                        <td>
                          {Array.isArray(problem.tags) ? (
                            problem.tags.map((tag: string, index: number) => (
                              <div
                                key={index}
                                className="badge badge-neutral mr-1 mb-1"
                              >
                                {tag}
                              </div>
                            ))
                          ) : (
                            <div className="badge badge-neutral">
                              {problem.tags}
                            </div>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => deleteProblem(problem._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {problems.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          No problems found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
