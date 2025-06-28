import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "react-toastify";
import { axiosClient } from "../utils/axiosClient";
import canvaSvg from "../assets/canva.svg";

interface Problem {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  difficulty: string;
  visibleTestCases: Array<{
    input: string;
    output: string;
    explanation: string;
    _id: string;
  }>;
  startCode: Array<{
    language: string;
    initialCode: string;
    _id: string;
  }>;
  referenceSolutions: Array<{
    language: string;
    solution: string;
    _id: string;
  }>;
}

interface TestResult {
  source_code: string;
  language_id: number;
  stdin: string;
  expected_output: string;
  stdout: string;
  status_id: number;
  status: {
    id: number;
    description: string;
  };
  time: string;
  memory: number;
  stderr?: string;
}

interface SubmissionResult {
  _id: string;
  userId: string;
  problemId: string;
  code: string;
  language: string;
  status: "pending" | "accepted" | "wrong" | "error";
  runtime: number;
  memory: number;
  errorMessage?: string;
  testCasesPassed: number;
  testCasesTotal: number;
  createdAt: string;
  updatedAt: string;
}

export function ProblemPage() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("c++");
  const [leftActiveTab, setLeftActiveTab] = useState(0);
  const [rightActiveTab, setRightActiveTab] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [submissionResults, setSubmissionResults] = useState<
    SubmissionResult[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef<any>(null);
  const { problemById } = useParams<{ problemById: string }>();
  const navigate = useNavigate();

  // Language mapping for Monaco Editor
  const languageMapping: { [key: string]: string } = {
    "c++": "cpp",
    c: "c",
    java: "java",
    python: "python",
    javascript: "javascript",
    python3: "python",
    js: "javascript",
  };

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(
          `/problem/problemById/${problemById}`
        );
        setProblem(response.data);
        // Set default language if available
        if (response.data.startCode && response.data.startCode.length > 0) {
          setSelectedLanguage(response.data.startCode[0].language);
        }
      } catch (error: any) {
        console.error("Error fetching problem:", error);
        if (error.response?.status === 404) {
          toast.error(
            "❌ Problem not found. It may have been removed or the URL is incorrect."
          );
        } else if (error.response?.status >= 500) {
          toast.error(
            "🔧 Server error while loading problem. Please try again later."
          );
        } else {
          toast.error("❌ Failed to load problem. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchPreviousSubmissions = async () => {
      try {
        const response = await axiosClient.get(
          `/submission/submittedProblem/${problemById}`
        );
        // Backend now returns empty array instead of 404 for no submissions
        if (response.data.ans && response.data.ans.length > 0) {
          // Sort by creation date, most recent first
          const sortedSubmissions = response.data.ans.sort(
            (a: SubmissionResult, b: SubmissionResult) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setSubmissionResults(sortedSubmissions);
          setHasSubmitted(true);
        } else {
          // No submissions yet - this is normal for unsolved problems
          console.log("No previous submissions found for this problem");
          setSubmissionResults([]);
          setHasSubmitted(false);
        }
      } catch (error: any) {
        // Only handle actual errors now (network issues, server errors, etc.)
        console.error("Error fetching previous submissions:", error);
        if (error.response?.status >= 500) {
          toast.error(
            "🔧 Server error while loading submission history. Please try again later."
          );
        } else if (error.response?.status === 401) {
          toast.error("🔒 Authentication required. Please log in again.");
        }
      }
    };

    if (problemById) {
      fetchProblem();
      fetchPreviousSubmissions();
    }
  }, [problemById]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const getCurrentCode = () => {
    return editorRef.current?.getValue() || "";
  };

  const getLanguageStartCode = () => {
    if (!problem) return "";
    const lang = problem.startCode.find((l) => l.language === selectedLanguage);
    return lang?.initialCode || "";
  };

  const getMonacoLanguage = () => {
    return languageMapping[selectedLanguage.toLowerCase()] || "javascript";
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    // Editor will re-mount due to key change and get new defaultValue
  };

  const runCode = async () => {
    if (!problemById || !editorRef.current) return;

    setIsRunning(true);
    try {
      const response = await axiosClient.post(
        `/submission/run/${problemById}`,
        {
          language: selectedLanguage,
          code: getCurrentCode(),
        }
      );

      console.log("Run response:", response.data); // Debug log
      // API returns {success, testCases, runtime, memory} structure
      setTestResults(response.data.testCases || []);
      setHasRun(true);
      setRightActiveTab(1); // Switch to Test Cases tab
    } catch (error: any) {
      console.error("Error running code:", error);

      if (error.response?.status === 429) {
        toast.error(
          "You are submitting too frequently! Please try again later"
        );
      } else if (error.response?.status === 404) {
        toast.error(
          "❌ Problem not found. Please refresh the page and try again."
        );
      } else if (error.response?.status >= 500) {
        toast.error("🔧 Server error. Please try again in a few moments.");
      } else {
        toast.error(
          "❌ Failed to run code. Please check your solution and try again."
        );
      }
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (!problemById || !editorRef.current) return;

    setIsSubmitting(true);
    try {
      console.log("Submitting code:", {
        problemById,
        language: selectedLanguage,
        code: getCurrentCode(),
      });

      const response = await axiosClient.post(
        `/submission/submit/${problemById}`,
        {
          language: selectedLanguage,
          code: getCurrentCode(),
        }
      );

      console.log("Submit response:", response.data);

      // After successful submission, fetch updated submissions list
      const submissionsResponse = await axiosClient.get(
        `/submission/submittedProblem/${problemById}`
      );

      if (
        submissionsResponse.data.ans &&
        submissionsResponse.data.ans.length > 0
      ) {
        // Sort by creation date, most recent first
        const sortedSubmissions = submissionsResponse.data.ans.sort(
          (a: SubmissionResult, b: SubmissionResult) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSubmissionResults(sortedSubmissions);
        setHasSubmitted(true);
        setRightActiveTab(2); // Switch to Results tab
      }
    } catch (error: any) {
      console.error("Error submitting code:", error);
      console.error("Error response:", error.response?.data);

      if (error.response?.status === 429) {
        toast.error(
          "⏳ Rate limit exceeded! Please wait before submitting again."
        );
      } else if (error.response?.status === 404) {
        toast.error(
          "❌ Problem not found. Please refresh the page and try again."
        );
      } else if (error.response?.status >= 500) {
        toast.error("🔧 Server error. Please try again in a few moments.");
      } else if (error.response?.status === 400) {
        toast.error(
          "❌ Invalid submission. Please check your code and try again."
        );
      } else {
        toast.error("❌ Failed to submit code. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftTabs = ["Description", "Solutions", "Editorial"];
  const rightTabs = ["Code", "Test Cases", "Results"];

  const renderLeftContent = () => {
    if (!problem) return <div className="p-4">Loading...</div>;

    switch (leftActiveTab) {
      case 0: // Description
        return (
          <div className="p-4 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
            <div className="prose prose-invert max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: problem.description }} />
            </div>

            <h3 className="text-lg font-semibold mb-3">Test Cases</h3>
            {problem.visibleTestCases.map((testCase, index) => (
              <div key={index} className="mb-4 p-3 bg-gray-800 rounded">
                <div className="mb-2">
                  <strong>Input:</strong>
                  <pre className="bg-gray-900 p-2 rounded mt-1 text-sm">
                    {testCase.input}
                  </pre>
                </div>
                <div>
                  <strong>Output:</strong>
                  <pre className="bg-gray-900 p-2 rounded mt-1 text-sm">
                    {testCase.output}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        );
      case 1: // Solutions
        return (
          <div className="p-4 overflow-y-auto max-h-full">
            <h2 className="text-xl font-bold mb-4">Reference Solutions</h2>
            {problem.referenceSolutions?.map((solution, index) => (
              <div key={index} className="mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  {solution.language}
                </h3>
                <pre className="bg-gray-800 p-4 rounded overflow-x-auto text-sm">
                  <code>{solution.solution}</code>
                </pre>
              </div>
            )) || (
              <div className="text-gray-400">
                No reference solutions available.
              </div>
            )}
          </div>
        );
      case 2: // Editorial
        return (
          <div className="p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editorial</h2>
            <div className="text-gray-400">
              Editorial content coming soon...
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderRightContent = () => {
    if (!problem) return <div className="p-4">Loading...</div>;

    switch (rightActiveTab) {
      case 0: // Code
        if (!problem || !problem.startCode || problem.startCode.length === 0) {
          return (
            <div className="p-4 text-center text-gray-400">
              Loading code editor...
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1"
              >
                {problem?.startCode && problem.startCode.length > 0 ? (
                  problem.startCode.map((lang) => (
                    <option key={lang.language} value={lang.language}>
                      {lang.language}
                    </option>
                  ))
                ) : (
                  <option>Loading languages...</option>
                )}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-1 rounded"
                >
                  {isRunning ? "Running..." : "Run"}
                </button>
                <button
                  onClick={submitCode}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-1 rounded"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <Editor
                key={selectedLanguage} // Force re-render when language changes
                theme="vs-dark"
                height="100%"
                language={getMonacoLanguage()}
                defaultValue={getLanguageStartCode()}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  contextmenu: false, // Disable right-click menu to prevent clipboard issues
                  copyWithSyntaxHighlighting: false, // Disable syntax highlighting in clipboard
                }}
              />
            </div>
          </div>
        );
      case 1: // Test Cases
        return (
          <div className="p-4 overflow-y-auto max-h-full">
            <h3 className="text-lg font-semibold mb-3">Test Case Results</h3>
            {!hasRun ? (
              <div className="text-gray-400 text-center py-8">
                Click "Run" to test your code with test cases
              </div>
            ) : (
              <div>
                {testResults && testResults.length > 0 ? (
                  testResults.map((result, index) => (
                    <div
                      key={index}
                      className="mb-4 p-3 border border-gray-700 rounded"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">
                          Test Case {index + 1}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            result.status.description === "Accepted"
                              ? "bg-green-800 text-green-200"
                              : "bg-red-800 text-red-200"
                          }`}
                        >
                          {result.status.description}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Input:</strong>
                          <pre className="bg-gray-800 p-2 rounded mt-1">
                            {result.stdin}
                          </pre>
                        </div>
                        <div>
                          <strong>Expected:</strong>
                          <pre className="bg-gray-800 p-2 rounded mt-1">
                            {result.expected_output}
                          </pre>
                        </div>
                        <div>
                          <strong>Output:</strong>
                          <pre className="bg-gray-800 p-2 rounded mt-1">
                            {result.stdout || "No output"}
                          </pre>
                        </div>
                        <div>
                          <strong>Runtime:</strong>
                          <span className="ml-2">
                            {result.time}s | {result.memory} KB
                          </span>
                        </div>
                      </div>
                      {result.stderr && (
                        <div className="mt-2">
                          <strong className="text-red-400">Error:</strong>
                          <pre className="bg-red-900 p-2 rounded mt-1 text-red-200">
                            {result.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    No test results available
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 2: // Results
        return (
          <div className="p-4 overflow-y-auto max-h-full">
            <h3 className="text-lg font-semibold mb-3">Submission Results</h3>
            {!hasSubmitted ? (
              <div className="text-gray-400 text-center py-8">
                Submit your solution to see results
              </div>
            ) : (
              <div>
                {submissionResults.map((result, index) => (
                  <div
                    key={index}
                    className="mb-4 p-3 border border-gray-700 rounded"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold">
                          Submission {index + 1}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(result.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          result.status === "accepted"
                            ? "bg-green-800 text-green-200"
                            : "bg-red-800 text-red-200"
                        }`}
                      >
                        {result.status === "accepted"
                          ? "Accepted"
                          : result.status === "wrong"
                          ? "Wrong Answer"
                          : result.status === "error"
                          ? "Error"
                          : "Pending"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Test Cases:</strong>
                        <span className="ml-2">
                          {result.testCasesPassed}/{result.testCasesTotal}
                        </span>
                      </div>
                      <div>
                        <strong>Runtime:</strong>
                        <span className="ml-2">{result.runtime}s</span>
                      </div>
                      <div>
                        <strong>Memory:</strong>
                        <span className="ml-2">{result.memory} KB</span>
                      </div>
                      <div>
                        <strong>Language:</strong>
                        <span className="ml-2">{result.language}</span>
                      </div>
                    </div>
                    {result.errorMessage && (
                      <div className="mt-2">
                        <strong className="text-red-400">Error:</strong>
                        <pre className="bg-red-900 p-2 rounded mt-1 text-red-200 text-sm">
                          {result.errorMessage}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen items-center justify-center flex flex-col gap-3">
        <img
          src={canvaSvg}
          alt="judge0-loading-icon"
          width={60}
          height={60}
          className="animate-bounce"
        />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">Problem not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Problems
        </button>
        <h1 className="text-xl font-semibold">{problem.title}</h1>
        <div className="w-32"></div> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left Panel */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          {/* Left Tabs */}
          <div className="flex border-b border-gray-700">
            {leftTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setLeftActiveTab(index)}
                className={`px-4 py-2 ${
                  leftActiveTab === index
                    ? "bg-gray-800 border-b-2 border-blue-500"
                    : "hover:bg-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Left Content */}
          <div className="flex-1 overflow-hidden">{renderLeftContent()}</div>
        </div>

        {/* Right Panel */}
        <div className="w-1/2 flex flex-col">
          {/* Right Tabs */}
          <div className="flex border-b border-gray-700">
            {rightTabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setRightActiveTab(index)}
                className={`px-4 py-2 ${
                  rightActiveTab === index
                    ? "bg-gray-800 border-b-2 border-blue-500"
                    : "hover:bg-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Right Content */}
          <div className="flex-1 overflow-hidden">{renderRightContent()}</div>
        </div>
      </div>
    </div>
  );
}
